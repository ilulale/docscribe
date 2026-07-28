from datetime import date, datetime, timezone
import time

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.database import get_db
from app.models.doctor import Doctor
from app.models.invoice import Invoice, InvoiceStatus
from app.models.note import Note
from app.models.session import Session, SessionStatus
from app.schemas.admin import (
    CreditsResponse,
    DoctorActiveUpdate,
    DoctorCreate,
    DoctorCreditUsage,
    DoctorModelUpdate,
    DoctorResponse,
    InvoiceCreate,
    InvoiceResponse,
    InvoiceStatusUpdate,
    StatsResponse,
)
from app.schemas.session import SessionResponse
from app.services.auth import hash_password
from app.services.processing import process_session

router = APIRouter(prefix="/api/admin", tags=["admin"])

# In-memory cache for OpenRouter models (1-hour TTL)
_models_cache: list[dict] = []
_models_cache_ts: float = 0
_MODELS_CACHE_TTL = 3600  # 1 hour


async def _fetch_models_from_openrouter() -> list[dict]:
    global _models_cache, _models_cache_ts
    now = time.time()
    if _models_cache and (now - _models_cache_ts) < _MODELS_CACHE_TTL:
        return _models_cache

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get("https://openrouter.ai/api/v1/models")
            resp.raise_for_status()
            data = resp.json().get("data", [])
            _models_cache = [
                {
                    "slug": m["id"],
                    "name": m.get("name", m["id"]),
                    "pricing": m.get("pricing", {"prompt": "0", "completion": "0"}),
                }
                for m in data
            ]
            _models_cache_ts = now
            return _models_cache
    except Exception:
        return _models_cache or []


@router.get("/doctors", response_model=list[DoctorResponse])
async def list_doctors(
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).order_by(Doctor.created_at.desc()))
    return result.scalars().all()


@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    body: DoctorCreate,
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Doctor).where(Doctor.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    doctor = Doctor(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        openrouter_model=body.openrouter_model,
    )
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.patch("/doctors/{doctor_id}/active", response_model=DoctorResponse)
async def toggle_doctor_active(
    doctor_id: int,
    body: DoctorActiveUpdate,
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    doctor.is_active = body.is_active
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.patch("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor_model(
    doctor_id: int,
    body: DoctorModelUpdate,
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    doctor.openrouter_model = body.openrouter_model
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Invoice).order_by(Invoice.created_at.desc()))
    return result.scalars().all()


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    body: InvoiceCreate,
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    doctor_result = await db.execute(select(Doctor).where(Doctor.id == body.doctor_id))
    if not doctor_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    invoice = Invoice(
        doctor_id=body.doctor_id,
        amount=body.amount,
        currency=body.currency,
        period_start=body.period_start,
        period_end=body.period_end,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.patch("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice_status(
    invoice_id: int,
    body: InvoiceStatusUpdate,
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    invoice.status = body.status
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total_doctors = (await db.execute(select(func.count(Doctor.id)))).scalar() or 0
    total_sessions = (await db.execute(select(func.count(Session.id)))).scalar() or 0

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    sessions_today = (
        await db.execute(
            select(func.count(Session.id)).where(Session.created_at >= today_start)
        )
    ).scalar() or 0

    return StatsResponse(
        total_doctors=total_doctors,
        sessions_today=sessions_today,
        total_sessions=total_sessions,
    )


@router.get("/credits", response_model=CreditsResponse)
async def get_credits(
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).order_by(Doctor.id))
    doctors = result.scalars().all()

    token_query = (
        select(
            Session.doctor_id,
            func.coalesce(Note.model_slug, Doctor.openrouter_model).label("model_slug"),
            func.coalesce(func.sum(Note.prompt_tokens), 0).label("prompt"),
            func.coalesce(func.sum(Note.completion_tokens), 0).label("completion"),
            func.count(Session.id).label("total_sessions"),
        )
        .outerjoin(Note, Note.session_id == Session.id)
        .join(Doctor, Doctor.id == Session.doctor_id)
        .group_by(Session.doctor_id, Note.model_slug, Doctor.openrouter_model)
    )
    token_result = await db.execute(token_query)

    credit_usages = []
    for row in token_result.all():
        doctor = next((d for d in doctors if d.id == row.doctor_id), None)
        if not doctor:
            continue
        credit_usages.append(
            DoctorCreditUsage(
                doctor_id=doctor.id,
                doctor_name=doctor.name,
                openrouter_model=row.model_slug,
                total_prompt_tokens=row.prompt,
                total_completion_tokens=row.completion,
                total_sessions=row.total_sessions,
            )
        )

    return CreditsResponse(doctors=credit_usages)


@router.get("/models")
async def list_models(
    admin: Doctor = Depends(get_current_admin),
):
    models = await _fetch_models_from_openrouter()
    return models


@router.post("/sessions/{session_id}/reprocess", response_model=SessionResponse)
async def reprocess_session(
    session_id: int,
    admin: Doctor = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    note_result = await db.execute(select(Note).where(Note.session_id == session.id))
    note = note_result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if not session.audio_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has no audio to reprocess",
        )

    # Un-sign the note so it becomes editable again after reprocess
    note.is_signed = False
    note.signed_at = None

    session.status = SessionStatus.pending
    session.error_message = None
    await db.commit()
    await db.refresh(session)

    process_session.delay(session.id)

    return session
