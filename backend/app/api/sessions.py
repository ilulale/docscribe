from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_doctor
from app.database import get_db
from app.models.doctor import Doctor
from app.models.letterhead import DoctorLetterhead
from app.models.note import Note
from app.models.patient import Patient
from app.models.report_template import DoctorReportTemplate
from app.models.session import Session, SessionStatus
from app.schemas.note import NoteResponse, NoteUpdate
from app.schemas.session import (
    SessionCreate,
    SessionDetailResponse,
    SessionResponse,
    SessionStatusResponse,
)
from app.services.openrouter import generate_soap
from app.services.pdf import generate_pdf
from app.services.processing import _parse_soap_json, process_session
from app.services.storage import download_audio, get_status_progress, upload_audio as upload_audio_to_storage

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

    count_result = await db.execute(
        select(func.count()).select_from(Session).where(Session.doctor_id == doctor.id)
    )
    next_number = count_result.scalar() + 1

    session = Session(doctor_id=doctor.id, patient_id=body.patient_id, sequence_number=next_number)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/audio", response_model=SessionResponse)
async def upload_audio(
    session_id: int,
    file: UploadFile = File(...),
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")

    object_name = upload_audio_to_storage(session_id, audio_bytes, file.content_type or "audio/webm")
    session.audio_path = object_name
    session.status = SessionStatus.pending
    await db.commit()

    process_session.delay(session.id)
    return session


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
    query = (
        select(Session, Patient.name.label("patient_name"))
        .join(Patient, Session.patient_id == Patient.id, isouter=True)
        .where(Session.doctor_id == doctor.id)
    )
    if session_status:
        query = query.where(Session.status == session_status)
    if date_from:
        query = query.where(Session.created_at >= date_from)
    if date_to:
        query = query.where(Session.created_at <= date_to)
    query = query.order_by(Session.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return [
        SessionResponse(
            id=session.id,
            doctor_id=session.doctor_id,
            patient_id=session.patient_id,
            patient_name=patient_name,
            sequence_number=session.sequence_number,
            audio_path=session.audio_path,
            duration_seconds=session.duration_seconds,
            status=session.status,
            error_message=session.error_message,
            created_at=session.created_at,
            completed_at=session.completed_at,
        )
        for session, patient_name in result.all()
    ]


@router.get("/{session_id}/audio")
async def get_session_audio(
    session_id: int,
    token: str | None = Query(None),
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
):
    from app.services.auth import decode_token

    if credentials:
        payload = decode_token(credentials.credentials)
    elif token:
        payload = decode_token(token)
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    doctor_id = int(payload["sub"])
    result = await db.execute(
        select(Doctor).where(Doctor.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()
    if doctor is None or not doctor.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor not found or inactive")

    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if not session.audio_path:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio available")

    audio_bytes = download_audio(session.audio_path)
    return Response(content=audio_bytes, media_type="audio/webm")


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


async def _get_session_and_note(
    session_id: int,
    doctor: Doctor,
    db: AsyncSession,
) -> tuple[Session, Note | None]:
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.doctor_id == doctor.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    note_result = await db.execute(select(Note).where(Note.session_id == session.id))
    note = note_result.scalar_one_or_none()
    return session, note


@router.get("/{session_id}/note", response_model=NoteResponse)
async def get_note(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    session, note = await _get_session_and_note(session_id, doctor, db)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.put("/{session_id}/note", response_model=NoteResponse)
async def update_note(
    session_id: int,
    body: NoteUpdate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    session, note = await _get_session_and_note(session_id, doctor, db)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.is_signed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit a signed note")

    if body.transcript is not None:
        note.transcript = body.transcript
    if body.soap_json is not None:
        note.soap_json = body.soap_json

    await db.commit()
    await db.refresh(note)
    return note


@router.post("/{session_id}/sign", response_model=NoteResponse)
async def sign_note(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    session, note = await _get_session_and_note(session_id, doctor, db)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.is_signed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note is already signed")

    note.is_signed = True
    note.signed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(note)
    return note


@router.post("/{session_id}/regenerate", response_model=NoteResponse)
async def regenerate_note(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    session, note = await _get_session_and_note(session_id, doctor, db)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.is_signed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot regenerate a signed note")
    if not note.transcript:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcript to regenerate from")

    try:
        soap_result = generate_soap(note.transcript)
        note.soap_json = _parse_soap_json(soap_result.content)
        note.signed_soap_text = soap_result.content
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SOAP generation failed: {e}",
        )

    await db.commit()
    await db.refresh(note)
    return note


@router.get("/{session_id}/note/pdf")
async def get_note_pdf(
    session_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    session, note = await _get_session_and_note(session_id, doctor, db)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if not note.soap_json:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No SOAP data to generate PDF")

    letterhead_result = await db.execute(
        select(DoctorLetterhead).where(DoctorLetterhead.doctor_id == doctor.id)
    )
    letterhead = letterhead_result.scalar_one_or_none()

    letterhead_dict = {}
    logo_path = None
    if letterhead:
        letterhead_dict = {
            "clinic_name": letterhead.clinic_name,
            "doctor_qualifications": letterhead.doctor_qualifications,
            "address": letterhead.address,
            "phone": letterhead.phone,
            "email": letterhead.email,
            "website": letterhead.website,
            "registration_numbers": letterhead.registration_numbers,
            "opd_hours": letterhead.opd_hours,
        }
        logo_path = letterhead.logo_path

    template_result = await db.execute(
        select(DoctorReportTemplate).where(DoctorReportTemplate.doctor_id == doctor.id)
    )
    template = template_result.scalar_one_or_none()
    template_sections = template.sections if template else None
    pdf_footer = template.pdf_footer if template else None

    try:
        pdf_bytes = generate_pdf(
            soap_json=note.soap_json,
            doctor_name=doctor.name,
            letterhead=letterhead_dict,
            logo_path=logo_path,
            is_signed=note.is_signed,
            signed_at=note.signed_at,
            template_sections=template_sections,
            pdf_footer=pdf_footer,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation failed: {e}",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="note_{session_id}.pdf"'},
    )
