from datetime import datetime

from pydantic import BaseModel


class PatientCreate(BaseModel):
    name: str


class PatientResponse(BaseModel):
    id: int
    doctor_id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientSearchResult(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
