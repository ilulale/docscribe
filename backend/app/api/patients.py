from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_doctor
from app.database import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse, PatientSearchResult

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    body: PatientCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    patient = Patient(name=body.name, doctor_id=doctor.id)
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    query = select(Patient).where(Patient.doctor_id == doctor.id)
    if search:
        query = query.where(Patient.name.ilike(f"%{search}%"))
    query = query.order_by(Patient.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.get("/{patient_id}/sessions")
async def get_patient_sessions(
    patient_id: int,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    from app.models.session import Session

    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    result = await db.execute(
        select(Session)
        .where(Session.patient_id == patient_id, Session.doctor_id == doctor.id)
        .order_by(Session.created_at.desc())
    )
    return result.scalars().all()


@router.post("/search", response_model=list[PatientSearchResult])
async def search_patients(
    body: PatientCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .where(Patient.doctor_id == doctor.id, Patient.name.ilike(f"%{body.name}%"))
        .order_by(Patient.name)
        .limit(10)
    )
    return result.scalars().all()
