from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_doctor
from app.database import get_db
from app.models.doctor import Doctor
from app.models.note import Note
from app.models.patient import Patient
from app.models.session import Session, SessionStatus
from app.schemas.session import (
    AudioUploadResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionResponse,
    SessionStatusResponse,
)
from app.services.processing import process_session
from app.services.storage import generate_presigned_upload_url, get_status_progress

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient).where(Patient.id == body.patient_id, Patient.doctor_id == doctor.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    session = Session(doctor_id=doctor.id, patient_id=body.patient_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/audio", response_model=AudioUploadResponse)
async def upload_audio(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    upload_url, object_name = generate_presigned_upload_url(session_id)
    session.audio_path = object_name
    session.status = SessionStatus.pending
    await db.commit()

    process_session.delay(session.id)

    return AudioUploadResponse(upload_url=upload_url, session_id=session.id)


@router.get("/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return SessionStatusResponse(
        id=session.id,
        status=session.status,
        error_message=session.error_message,
        estimated_progress=get_status_progress(session.status.value),
    )


@router.post("/{session_id}/retry", response_model=SessionResponse)
async def retry_session(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.status != SessionStatus.failed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only retry failed sessions")

    if not session.audio_path:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio to retry")

    session.status = SessionStatus.pending
    session.error_message = None
    await db.commit()
    await db.refresh(session)

    process_session.delay(session.id)

    return session


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    session_status: SessionStatus | None = Query(None, alias="status"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    query = select(Session).where(Session.doctor_id == doctor.id)
    if session_status:
        query = query.where(Session.status == session_status)
    if date_from:
        query = query.where(Session.created_at >= date_from)
    if date_to:
        query = query.where(Session.created_at <= date_to)
    query = query.order_by(Session.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    patient_result = await db.execute(select(Patient).where(Patient.id == session.patient_id))
    patient = patient_result.scalar_one_or_none()

    note_result = await db.execute(select(Note).where(Note.session_id == session.id))
    note = note_result.scalar_one_or_none()

    return SessionDetailResponse(
        id=session.id,
        doctor_id=session.doctor_id,
        patient_id=session.patient_id,
        audio_path=session.audio_path,
        duration_seconds=session.duration_seconds,
        status=session.status,
        error_message=session.error_message,
        created_at=session.created_at,
        completed_at=session.completed_at,
        patient_name=patient.name if patient else None,
        note_transcript=note.transcript if note else None,
        note_soap_json=note.soap_json if note else None,
        note_is_signed=note.is_signed if note else None,
    )
