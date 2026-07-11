from datetime import datetime

from pydantic import BaseModel

from app.models.invoice import InvoiceStatus


class DoctorCreate(BaseModel):
    name: str
    email: str
    password: str


class DoctorResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorActiveUpdate(BaseModel):
    is_active: bool


class InvoiceCreate(BaseModel):
    doctor_id: int
    amount: float
    currency: str = "INR"
    period_start: datetime | None = None
    period_end: datetime | None = None


class InvoiceResponse(BaseModel):
    id: int
    doctor_id: int
    amount: float
    currency: str
    status: InvoiceStatus
    period_start: datetime | None
    period_end: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus


class StatsResponse(BaseModel):
    total_doctors: int
    sessions_today: int
    total_sessions: int


class DoctorCreditUsage(BaseModel):
    doctor_id: int
    doctor_name: str
    total_prompt_tokens: int
    total_completion_tokens: int
    total_sessions: int


class CreditsResponse(BaseModel):
    doctors: list[DoctorCreditUsage]
