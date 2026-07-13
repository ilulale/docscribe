from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patients = relationship("Patient", back_populates="doctor", lazy="selectin")
    sessions = relationship("Session", back_populates="doctor", lazy="selectin")
    invoices = relationship("Invoice", back_populates="doctor", lazy="selectin")
    letterhead = relationship("DoctorLetterhead", back_populates="doctor", uselist=False, lazy="selectin")
    report_template = relationship("DoctorReportTemplate", back_populates="doctor", uselist=False, lazy="selectin")
