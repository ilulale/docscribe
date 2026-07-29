from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

DEFAULT_OPENING_PERSONA = "You are an expert medical scribe generating a clinical note from a doctor-patient conversation transcript."

DEFAULT_TRANSCRIPT_CONTEXT = "You will receive a transcript of a doctor-patient interaction (already translated into English). Convert it into a detailed, professional clinical note following the sections below."

DEFAULT_STRICT_RULES = (
    "- Base every statement ONLY on information explicitly present in the transcript. Do NOT infer, assume, or fabricate any clinical detail, vital sign, history, or diagnosis that was not stated.\n"
    '- If a section has no corresponding information in the transcript, write "Not discussed" or "Not documented" for that section — do not guess or leave it blank.\n'
    "- Use standard clinical terminology and formatting a physician would expect in a medical record.\n"
    "- Do not include any commentary, disclaimers, or notes about the AI process itself. Output ONLY the clinical note."
)

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
    opening_persona: Mapped[str] = mapped_column(Text, default=DEFAULT_OPENING_PERSONA)
    transcript_context: Mapped[str] = mapped_column(Text, default=DEFAULT_TRANSCRIPT_CONTEXT)
    strict_rules: Mapped[str] = mapped_column(Text, default=DEFAULT_STRICT_RULES)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="report_template")
