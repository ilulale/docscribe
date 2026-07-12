import logging
from datetime import datetime, timezone

from celery.exceptions import Retry
from sqlalchemy import create_engine
from sqlalchemy.orm import Session as SyncSession, sessionmaker

from app.celery_app import celery_app
from app.config import settings
from app.models.note import Note
from app.models.session import Session, SessionStatus
from app.services.openrouter import generate_soap, transcribe_audio
from app.services.storage import get_minio_client

logger = logging.getLogger(__name__)

_sync_session_factory = None


def _get_db() -> SyncSession:
    global _sync_session_factory
    if _sync_session_factory is None:
        engine = create_engine(settings.database_url_sync)
        _sync_session_factory = sessionmaker(bind=engine)
    return _sync_session_factory()


def _download_audio(audio_path: str) -> bytes:
    client = get_minio_client()
    response = client.get_object(settings.minio_bucket, audio_path)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


_SECTION_MAP = {
    "SUBJECTIVE": "subjective",
    "OBJECTIVE": "objective",
    "ASSESSMENT": "assessment",
    "PLAN": "plan",
    "ADDITIONAL NOTES": "additional_notes",
}


def _parse_soap_json(soap_text: str) -> dict:
    sections: dict[str, list[str]] = {}
    current_section: str | None = None

    for line in soap_text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue

        upper = stripped.upper()
        matched_key = None
        for header, key in _SECTION_MAP.items():
            if upper == header or upper.startswith(header + ":"):
                matched_key = key
                break

        if matched_key is not None:
            current_section = matched_key
            sections.setdefault(current_section, [])
            # Handle inline content on the same line as the header
            if ":" in stripped:
                after_colon = stripped.split(":", 1)[1].strip()
                if after_colon:
                    sections[current_section].append(after_colon)
        elif current_section is not None:
            sections[current_section].append(stripped)

    return {k: "\n".join(v) for k, v in sections.items()}


@celery_app.task(name="process_session", bind=True, max_retries=1)
def process_session(self, session_id: int):
    db = _get_db()
    try:
        session = db.get(Session, session_id)
        if not session:
            logger.error(f"Session {session_id} not found")
            return

        if not session.audio_path:
            session.status = SessionStatus.failed
            session.error_message = "No audio file path"
            db.commit()
            return

        total_prompt_tokens = 0
        total_completion_tokens = 0

        # Stage 1: Transcription
        session.status = SessionStatus.transcribing
        db.commit()

        try:
            audio_bytes = _download_audio(session.audio_path)
            transcribe_result = transcribe_audio(audio_bytes)
            transcript = transcribe_result.content
            total_prompt_tokens += transcribe_result.prompt_tokens
            total_completion_tokens += transcribe_result.completion_tokens
        except Exception as e:
            logger.exception(f"Transcription failed for session {session_id}")
            _fail_session(db, session, f"Transcription failed: {e}")
            if self.request.retries < self.max_retries:
                raise self.retry(countdown=60)
            return

        # Stage 2: SOAP generation
        session.status = SessionStatus.generating_soap
        db.commit()

        try:
            soap_result = generate_soap(transcript)
            soap_text = soap_result.content
            total_prompt_tokens += soap_result.prompt_tokens
            total_completion_tokens += soap_result.completion_tokens
        except Exception as e:
            logger.exception(f"SOAP generation failed for session {session_id}")
            _fail_session(db, session, f"SOAP generation failed: {e}")
            if self.request.retries < self.max_retries:
                raise self.retry(countdown=60)
            return

        # Save note
        soap_json = _parse_soap_json(soap_text)
        note = Note(
            session_id=session.id,
            transcript=transcript,
            soap_json=soap_json,
            signed_soap_text=soap_text,
            prompt_tokens=total_prompt_tokens,
            completion_tokens=total_completion_tokens,
        )
        db.add(note)

        session.status = SessionStatus.completed
        session.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            f"Session {session_id} completed. "
            f"Tokens: prompt={total_prompt_tokens}, completion={total_completion_tokens}"
        )

    except Retry:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error processing session {session_id}")
        try:
            session = db.get(Session, session_id)
            if session:
                _fail_session(db, session, f"Unexpected error: {e}")
        except Exception:
            pass
    finally:
        db.close()


def _fail_session(db: SyncSession, session: Session, error_message: str):
    session.status = SessionStatus.failed
    session.error_message = error_message
    db.commit()
