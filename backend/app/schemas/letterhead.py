from datetime import datetime

from pydantic import BaseModel


class LetterheadResponse(BaseModel):
    id: int
    doctor_id: int
    logo_path: str | None
    clinic_name: str | None
    doctor_qualifications: str | None
    address: str | None
    phone: str | None
    email: str | None
    website: str | None
    registration_numbers: str | None
    opd_hours: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LetterheadUpdate(BaseModel):
    clinic_name: str | None = None
    doctor_qualifications: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    registration_numbers: str | None = None
    opd_hours: str | None = None
