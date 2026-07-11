from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_doctor
from app.database import get_db
from app.models.doctor import Doctor
from app.models.letterhead import DoctorLetterhead
from app.schemas.letterhead import LetterheadResponse, LetterheadUpdate
from app.services.storage import delete_logo, upload_logo

router = APIRouter(prefix="/api/letterhead", tags=["letterhead"])


async def _get_letterhead(doctor: Doctor, db: AsyncSession) -> DoctorLetterhead:
    result = await db.execute(
        select(DoctorLetterhead).where(DoctorLetterhead.doctor_id == doctor.id)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=LetterheadResponse)
async def get_letterhead(
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    letterhead = await _get_letterhead(doctor, db)
    if not letterhead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No letterhead configured",
        )
    return letterhead


@router.post("", response_model=LetterheadResponse)
async def upsert_letterhead(
    body: LetterheadUpdate,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoctorLetterhead).where(DoctorLetterhead.doctor_id == doctor.id)
    )
    letterhead = result.scalar_one_or_none()

    if letterhead is None:
        letterhead = DoctorLetterhead(doctor_id=doctor.id)
        db.add(letterhead)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(letterhead, field, value)

    await db.commit()
    await db.refresh(letterhead)
    return letterhead


@router.post("/logo", response_model=LetterheadResponse)
async def upload_logo_endpoint(
    file: UploadFile,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be under 5MB",
        )

    result = await db.execute(
        select(DoctorLetterhead).where(DoctorLetterhead.doctor_id == doctor.id)
    )
    letterhead = result.scalar_one_or_none()

    if letterhead is None:
        letterhead = DoctorLetterhead(doctor_id=doctor.id)
        db.add(letterhead)
        await db.flush()

    if letterhead.logo_path:
        delete_logo(letterhead.logo_path)

    logo_path = upload_logo(doctor.id, file.filename or "logo.png", data)
    letterhead.logo_path = logo_path

    await db.commit()
    await db.refresh(letterhead)
    return letterhead


@router.delete("/logo", response_model=LetterheadResponse)
async def delete_logo_endpoint(
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoctorLetterhead).where(DoctorLetterhead.doctor_id == doctor.id)
    )
    letterhead = result.scalar_one_or_none()

    if not letterhead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No letterhead configured",
        )

    if letterhead.logo_path:
        delete_logo(letterhead.logo_path)
        letterhead.logo_path = None
        await db.commit()
        await db.refresh(letterhead)

    return letterhead
