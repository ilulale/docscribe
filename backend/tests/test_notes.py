from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.models.note import Note
from app.models.patient import Patient
from app.models.session import Session, SessionStatus
from app.services.auth import create_access_token, hash_password

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(TEST_DB_URL)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db():
    async with async_session_factory() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def doctor():
    async with async_session_factory() as db:
        d = Doctor(name="Dr. Test", email="test@example.com", hashed_password=hash_password("pass123"))
        db.add(d)
        await db.commit()
        await db.refresh(d)
        return d


@pytest.fixture
async def patient(doctor):
    async with async_session_factory() as db:
        p = Patient(name="Rahul Sharma", doctor_id=doctor.id)
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p


@pytest.fixture
def auth_headers(doctor):
    token = create_access_token(doctor.id)
    return {"Authorization": f"Bearer {token}"}


async def _create_session_with_note(
    doctor_id: int,
    patient_id: int,
    session_status: SessionStatus = SessionStatus.completed,
    transcript: str | None = "Doctor: Hello. Patient: Hi.",
    soap_json: dict | None = None,
    is_signed: bool = False,
) -> tuple[int, int]:
    async with async_session_factory() as db:
        session = Session(
            doctor_id=doctor_id,
            patient_id=patient_id,
            status=session_status,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        note = Note(
            session_id=session.id,
            transcript=transcript,
            soap_json=soap_json or {"subjective": "- CC: Test"},
            is_signed=is_signed,
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)
        return session.id, note.id


async def test_get_note(client, auth_headers, doctor, patient):
    session_id, note_id = await _create_session_with_note(doctor.id, patient.id)

    resp = await client.get(f"/api/sessions/{session_id}/note", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == note_id
    assert data["session_id"] == session_id
    assert data["transcript"] == "Doctor: Hello. Patient: Hi."
    assert data["soap_json"]["subjective"] == "- CC: Test"
    assert data["is_signed"] is False


async def test_get_note_not_found(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id)

    async with async_session_factory() as db:
        note = await db.execute(
            __import__("sqlalchemy").delete(Note).where(Note.session_id == session_id)
        )
        await db.commit()

    resp = await client.get(f"/api/sessions/{session_id}/note", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_note_session_not_found(client, auth_headers):
    resp = await client.get("/api/sessions/9999/note", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_note_cross_doctor隔离(client, doctor, patient):
    async with async_session_factory() as db:
        d2 = Doctor(name="Dr. Two", email="d2@test.com", hashed_password=hash_password("pass"))
        db.add(d2)
        await db.commit()
        await db.refresh(d2)

    token_d2 = create_access_token(d2.id)
    session_id, _ = await _create_session_with_note(doctor.id, patient.id)

    resp = await client.get(
        f"/api/sessions/{session_id}/note",
        headers={"Authorization": f"Bearer {token_d2}"},
    )
    assert resp.status_code == 404


async def test_update_note(client, auth_headers, doctor, patient):
    session_id, note_id = await _create_session_with_note(doctor.id, patient.id)

    resp = await client.put(
        f"/api/sessions/{session_id}/note",
        json={"transcript": "Updated transcript", "soap_json": {"subjective": "- Updated"}},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["transcript"] == "Updated transcript"
    assert data["soap_json"]["subjective"] == "- Updated"


async def test_update_note_partial(client, auth_headers, doctor, patient):
    session_id, note_id = await _create_session_with_note(doctor.id, patient.id)

    resp = await client.put(
        f"/api/sessions/{session_id}/note",
        json={"transcript": "Only transcript updated"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["transcript"] == "Only transcript updated"
    assert data["soap_json"]["subjective"] == "- CC: Test"


async def test_update_note_signed_rejected(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id, is_signed=True)

    resp = await client.put(
        f"/api/sessions/{session_id}/note",
        json={"transcript": "Should not work"},
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "signed" in resp.json()["detail"].lower()


async def test_update_note_not_found(client, auth_headers):
    resp = await client.put(
        "/api/sessions/9999/note",
        json={"transcript": "Test"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_sign_note(client, auth_headers, doctor, patient):
    session_id, note_id = await _create_session_with_note(doctor.id, patient.id)

    resp = await client.post(f"/api/sessions/{session_id}/sign", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_signed"] is True
    assert data["signed_at"] is not None


async def test_sign_note_already_signed(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id, is_signed=True)

    resp = await client.post(f"/api/sessions/{session_id}/sign", headers=auth_headers)
    assert resp.status_code == 400
    assert "already signed" in resp.json()["detail"].lower()


async def test_sign_note_not_found(client, auth_headers):
    resp = await client.post("/api/sessions/9999/sign", headers=auth_headers)
    assert resp.status_code == 404


async def test_regenerate_note(client, auth_headers, doctor, patient):
    session_id, note_id = await _create_session_with_note(doctor.id, patient.id)

    mock_result = MagicMock()
    mock_result.content = "SUBJECTIVE:\n- CC: Regenerated\n\nASSESSMENT:\n- New diagnosis"

    with patch("app.api.sessions.generate_soap", return_value=mock_result):
        resp = await client.post(f"/api/sessions/{session_id}/regenerate", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["soap_json"]["subjective"] == "- CC: Regenerated"
        assert data["soap_json"]["assessment"] == "- New diagnosis"


async def test_regenerate_note_signed_rejected(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id, is_signed=True)

    resp = await client.post(f"/api/sessions/{session_id}/regenerate", headers=auth_headers)
    assert resp.status_code == 400
    assert "signed" in resp.json()["detail"].lower()


async def test_regenerate_note_no_transcript(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id, transcript=None)

    resp = await client.post(f"/api/sessions/{session_id}/regenerate", headers=auth_headers)
    assert resp.status_code == 400
    assert "transcript" in resp.json()["detail"].lower()


async def test_regenerate_note_api_failure(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id)

    with patch("app.api.sessions.generate_soap", side_effect=Exception("API down")):
        resp = await client.post(f"/api/sessions/{session_id}/regenerate", headers=auth_headers)
        assert resp.status_code == 502
        assert "SOAP generation failed" in resp.json()["detail"]


async def test_regenerate_note_not_found(client, auth_headers):
    resp = await client.post("/api/sessions/9999/regenerate", headers=auth_headers)
    assert resp.status_code == 404


async def test_get_note_pdf_placeholder(client, auth_headers, doctor, patient):
    session_id, _ = await _create_session_with_note(doctor.id, patient.id)

    resp = await client.get(f"/api/sessions/{session_id}/note/pdf", headers=auth_headers)
    assert resp.status_code == 200
    assert "PDF generation not yet implemented" in resp.json()["detail"]


async def test_get_note_pdf_not_found(client, auth_headers):
    resp = await client.get("/api/sessions/9999/note/pdf", headers=auth_headers)
    assert resp.status_code == 404
