from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

DEFAULT_SECTIONS = [
    {
        "key": "subjective",
        "label": "Subjective",
        "prompt_instructions": "Chief Complaint (CC), History of Present Illness (HPI), Past Medical History (PMH), Medications, Allergies, Family/Social History (if mentioned), Review of Systems (only systems discussed)",
        "order": 1,
        "visible": True,
    },
    {
        "key": "objective",
        "label": "Objective",
        "prompt_instructions": "Vital Signs (if mentioned), Physical Examination Findings (if mentioned), Investigations/Labs/Imaging discussed or ordered",
        "order": 2,
        "visible": True,
    },
    {
        "key": "assessment",
        "label": "Assessment",
        "prompt_instructions": "Clinical impression / working diagnosis (only if stated or clearly implied), Differential diagnoses (only if explicitly discussed)",
        "order": 3,
        "visible": True,
    },
    {
        "key": "plan",
        "label": "Plan",
        "prompt_instructions": "Medications prescribed (name, dose, frequency, duration), Investigations ordered, Referrals, Follow-up instructions, Patient education/counseling given",
        "order": 4,
        "visible": True,
    },
    {
        "key": "additional_notes",
        "label": "Additional Notes",
        "prompt_instructions": "Anything clinically relevant that doesn't fit above categories, e.g. patient concerns, non-compliance mentioned",
        "order": 5,
        "visible": True,
    },
]


class DoctorReportTemplate(Base):
    __tablename__ = "doctor_report_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), unique=True)
    sections: Mapped[dict] = mapped_column(JSON, default=list)
    pdf_footer: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="report_template")
