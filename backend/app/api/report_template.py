from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_doctor
from app.database import get_db
from app.models.doctor import Doctor
from app.models.report_template import DEFAULT_SECTIONS, DoctorReportTemplate
from app.schemas.report_template import ReportTemplateInput, ReportTemplateResponse

router = APIRouter(prefix="/api/report-template", tags=["report-template"])


@router.get("", response_model=ReportTemplateResponse)
async def get_report_template(
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoctorReportTemplate).where(DoctorReportTemplate.doctor_id == doctor.id)
    )
    template = result.scalar_one_or_none()

    if not template:
        return ReportTemplateResponse(
            sections=DEFAULT_SECTIONS,
            pdf_footer=None,
        )

    return ReportTemplateResponse(
        sections=template.sections,
        pdf_footer=template.pdf_footer,
    )


@router.post("", response_model=ReportTemplateResponse)
async def upsert_report_template(
    body: ReportTemplateInput,
    doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoctorReportTemplate).where(DoctorReportTemplate.doctor_id == doctor.id)
    )
    template = result.scalar_one_or_none()

    sections_data = [s.model_dump() for s in body.sections]

    if template:
        template.sections = sections_data
        template.pdf_footer = body.pdf_footer
    else:
        template = DoctorReportTemplate(
            doctor_id=doctor.id,
            sections=sections_data,
            pdf_footer=body.pdf_footer,
        )
        db.add(template)

    await db.commit()
    await db.refresh(template)

    return ReportTemplateResponse(
        sections=template.sections,
        pdf_footer=template.pdf_footer,
    )
