import base64
from unittest.mock import MagicMock, patch

import pytest
from celery.exceptions import Retry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.note import Note
from app.models.session import Session, SessionStatus
from app.services.processing import _parse_soap_json, process_session
from app.services.openrouter import (
    OpenRouterResponse,
    encode_audio_bytes,
    generate_soap,
    transcribe_audio,
)

TEST_DB_URL = "sqlite:///./test_processing.db"
sync_engine = create_engine(TEST_DB_URL)
SyncSessionLocal = sessionmaker(bind=sync_engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=sync_engine)
    yield
    Base.metadata.drop_all(bind=sync_engine)


@pytest.fixture
def db():
    session = SyncSessionLocal()
    yield session
    session.close()


def _create_session(db, status=SessionStatus.pending, audio_path="sessions/1/audio.mp3"):
    session = Session(
        doctor_id=1,
        patient_id=1,
        audio_path=audio_path,
        status=status,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _fresh():
    return SyncSessionLocal()


class TestEncodeAudio:
    def test_encode_decode(self):
        original = b"fake audio bytes"
        encoded = encode_audio_bytes(original)
        assert isinstance(encoded, str)
        decoded = base64.b64decode(encoded)
        assert decoded == original

    def test_empty_bytes(self):
        assert encode_audio_bytes(b"") == ""


class TestParseSoapJson:
    def test_parse_full_soap(self):
        soap_text = """SUBJECTIVE:
- Chief Complaint (CC): Chest pain
- History of Present Illness (HPI): 45 year old male with acute onset chest pain
- Past Medical History (PMH): Hypertension
- Medications: Amlodipine 5mg
- Allergies: Penicillin

OBJECTIVE:
- Vital Signs: BP 140/90, HR 88
- Physical Examination Findings: Chest tenderness

ASSESSMENT:
- Clinical impression: Musculoskeletal chest pain

PLAN:
- Medications prescribed: Ibuprofen 400mg TID
- Follow-up in 2 weeks

Additional Notes: Patient anxious about cardiac risk"""
        result = _parse_soap_json(soap_text)
        assert "subjective" in result
        assert "objective" in result
        assert "assessment" in result
        assert "plan" in result
        assert "additional_notes" in result
        assert "Chest pain" in result["subjective"]
        assert "BP 140/90" in result["objective"]
        assert "Musculoskeletal" in result["assessment"]
        assert "Ibuprofen" in result["plan"]
        assert "anxious" in result["additional_notes"]

    def test_parse_minimal_soap(self):
        soap_text = """SUBJECTIVE:
- Chief Complaint (CC): Headache

ASSESSMENT:
- Tension headache"""
        result = _parse_soap_json(soap_text)
        assert "subjective" in result
        assert "assessment" in result
        assert "objective" not in result
        assert "plan" not in result

    def test_parse_empty(self):
        result = _parse_soap_json("")
        assert result == {}

    def test_parse_not_discussed(self):
        soap_text = """SUBJECTIVE:
- Chief Complaint (CC): Fever
- Past Medical History (PMH): Not discussed

OBJECTIVE:
- Vital Signs: Not documented

ASSESSMENT:
- Under evaluation"""
        result = _parse_soap_json(soap_text)
        assert "Not discussed" in result["subjective"]
        assert "Not documented" in result["objective"]


class TestOpenRouterClient:
    @patch("app.services.openrouter.httpx.post")
    def test_transcribe_audio(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "Doctor: How are you? Patient: Fine."}}],
            "usage": {"prompt_tokens": 100, "completion_tokens": 50},
        }
        mock_post.return_value = mock_resp

        result = transcribe_audio(b"fake audio")
        assert result.content == "Doctor: How are you? Patient: Fine."
        assert result.prompt_tokens == 100
        assert result.completion_tokens == 50

    @patch("app.services.openrouter.httpx.post")
    def test_generate_soap(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "SUBJECTIVE:\n- CC: Cough"}}],
            "usage": {"prompt_tokens": 200, "completion_tokens": 100},
        }
        mock_post.return_value = mock_resp

        result = generate_soap("Doctor: You have a cough?")
        assert "SUBJECTIVE" in result.content
        assert result.prompt_tokens == 200
        assert result.completion_tokens == 100

    @patch("app.services.openrouter.httpx.post")
    def test_openrouter_error(self, mock_post):
        import httpx
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            "500", request=MagicMock(), response=MagicMock(status_code=500)
        )
        mock_post.return_value = mock_resp

        with pytest.raises(httpx.HTTPStatusError):
            transcribe_audio(b"fake audio")


class TestProcessSession:
    @patch("app.services.processing._get_db")
    @patch("app.services.processing._download_audio")
    @patch("app.services.processing.generate_soap")
    @patch("app.services.processing.transcribe_audio")
    def test_happy_path(self, mock_transcribe, mock_soap, mock_download, mock_get_db, db):
        session = _create_session(db)
        sid = session.id
        db.close()

        mock_get_db.return_value = SyncSessionLocal()
        mock_download.return_value = b"fake audio bytes"
        mock_transcribe.return_value = OpenRouterResponse(
            content="Doctor: Hello. Patient: Hi doctor.",
            prompt_tokens=100,
            completion_tokens=50,
        )
        mock_soap.return_value = OpenRouterResponse(
            content="SUBJECTIVE:\n- CC: General checkup\n\nASSESSMENT:\n- Healthy",
            prompt_tokens=200,
            completion_tokens=100,
        )

        process_session.run(sid)

        with _fresh() as verified:
            updated = verified.query(Session).filter(Session.id == sid).one()
            assert updated.status == SessionStatus.completed
            assert updated.completed_at is not None

            note = verified.query(Note).filter(Note.session_id == sid).one()
            assert note.transcript == "Doctor: Hello. Patient: Hi doctor."
            assert note.soap_json["subjective"] == "- CC: General checkup"
            assert note.soap_json["assessment"] == "- Healthy"

    @patch("app.services.processing._get_db")
    @patch("app.services.processing._download_audio")
    @patch("app.services.processing.transcribe_audio")
    def test_transcription_failure(self, mock_transcribe, mock_download, mock_get_db, db):
        session = _create_session(db)
        sid = session.id
        db.close()

        mock_get_db.return_value = SyncSessionLocal()
        mock_download.return_value = b"fake audio bytes"
        mock_transcribe.side_effect = Exception("API error")

        with pytest.raises(Retry):
            process_session.run(sid)

        with _fresh() as verified:
            updated = verified.query(Session).filter(Session.id == sid).one()
            assert updated.status == SessionStatus.failed
            assert "Transcription failed" in updated.error_message

    @patch("app.services.processing._get_db")
    @patch("app.services.processing._download_audio")
    @patch("app.services.processing.generate_soap")
    @patch("app.services.processing.transcribe_audio")
    def test_soap_generation_failure(self, mock_transcribe, mock_soap, mock_download, mock_get_db, db):
        session = _create_session(db)
        sid = session.id
        db.close()

        mock_get_db.return_value = SyncSessionLocal()
        mock_download.return_value = b"fake audio bytes"
        mock_transcribe.return_value = OpenRouterResponse(
            content="transcript", prompt_tokens=10, completion_tokens=5
        )
        mock_soap.side_effect = Exception("SOAP API error")

        with pytest.raises(Retry):
            process_session.run(sid)

        with _fresh() as verified:
            updated = verified.query(Session).filter(Session.id == sid).one()
            assert updated.status == SessionStatus.failed
            assert "SOAP generation failed" in updated.error_message

    @patch("app.services.processing._get_db")
    def test_no_audio_path(self, mock_get_db, db):
        session = _create_session(db, audio_path=None)
        sid = session.id
        db.close()

        mock_get_db.return_value = SyncSessionLocal()

        process_session.run(sid)

        with _fresh() as verified:
            updated = verified.query(Session).filter(Session.id == sid).one()
            assert updated.status == SessionStatus.failed
            assert "No audio file path" in updated.error_message

    @patch("app.services.processing._get_db")
    def test_session_not_found(self, mock_get_db):
        mock_get_db.return_value = SyncSessionLocal()
        process_session.run(99999)
