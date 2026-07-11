from datetime import datetime

from pydantic import BaseModel

from app.models.session import SessionStatus


class SessionCreate(BaseModel):
    patient_id: int


class SessionResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    audio_path: str | None
    duration_seconds: int | None
    status: SessionStatus
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class SessionStatusResponse(BaseModel):
    id: int
    status: SessionStatus
    error_message: str | None
    estimated_progress: str | None = None


class AudioUploadResponse(BaseModel):
    upload_url: str
    session_id: int


class SessionDetailResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    audio_path: str | None
    duration_seconds: int | None
    status: SessionStatus
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None
    patient_name: str | None = None
    note_transcript: str | None = None
    note_soap_json: dict | None = None
    note_is_signed: bool | None = None
