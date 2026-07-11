from datetime import datetime

from pydantic import BaseModel


class NoteResponse(BaseModel):
    id: int
    session_id: int
    transcript: str | None
    soap_json: dict | None
    signed_soap_text: str | None
    is_signed: bool
    signed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NoteUpdate(BaseModel):
    transcript: str | None = None
    soap_json: dict | None = None
