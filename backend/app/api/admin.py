from datetime import date, datetime, timezone

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
    DoctorResponse,
    InvoiceCreate,
    InvoiceResponse,
    InvoiceStatusUpdate,
    StatsResponse,
)
from app.services.auth import hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


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
            func.coalesce(func.sum(Note.prompt_tokens), 0).label("prompt"),
            func.coalesce(func.sum(Note.completion_tokens), 0).label("completion"),
            func.count(Session.id).label("total_sessions"),
        )
        .outerjoin(Note, Note.session_id == Session.id)
        .group_by(Session.doctor_id)
    )
    token_result = await db.execute(token_query)
    token_rows = {row.doctor_id: row for row in token_result.all()}

    credit_usages = []
    for doctor in doctors:
        row = token_rows.get(doctor.id)
        credit_usages.append(
            DoctorCreditUsage(
                doctor_id=doctor.id,
                doctor_name=doctor.name,
                total_prompt_tokens=row.prompt if row else 0,
                total_completion_tokens=row.completion if row else 0,
                total_sessions=row.total_sessions if row else 0,
            )
        )

    return CreditsResponse(doctors=credit_usages)
