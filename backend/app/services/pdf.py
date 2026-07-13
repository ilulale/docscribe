import base64
from datetime import datetime, timezone, timedelta
from pathlib import Path

import jinja2
from weasyprint import HTML

_IST = timezone(timedelta(hours=5, minutes=30))

_template_dir = Path(__file__).parent.parent / "templates"
_template_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(_template_dir),
    autoescape=True,
)

SOAP_SECTIONS = [
    ("subjective", "Subjective"),
    ("objective", "Objective"),
    ("assessment", "Assessment"),
    ("plan", "Plan"),
    ("additional_notes", "Additional Notes"),
]


def _load_logo_b64(logo_path: str | None) -> str | None:
    if not logo_path:
        return None
    try:
        from app.services.storage import get_minio_client
        from app.config import settings

        client = get_minio_client()
        response = client.get_object(settings.minio_bucket, logo_path)
        try:
            data = response.read()
            return base64.b64encode(data).decode("utf-8")
        finally:
            response.close()
            response.release_conn()
    except Exception:
        return None


def generate_pdf(
    soap_json: dict,
    doctor_name: str,
    letterhead: dict,
    logo_path: str | None = None,
    is_signed: bool = False,
    signed_at: datetime | None = None,
    template_sections: list[dict] | None = None,
    pdf_footer: str | None = None,
) -> bytes:
    template = _template_env.get_template("note_pdf.html")

    logo_b64 = _load_logo_b64(logo_path)

    if template_sections:
        sections = [
            (s["key"], s["label"])
            for s in sorted(template_sections, key=lambda s: s.get("order", 0))
            if s.get("visible", True)
        ]
    else:
        sections = SOAP_SECTIONS

    signed_at_str = None
    if signed_at:
        if signed_at.tzinfo is None:
            signed_at = signed_at.replace(tzinfo=timezone.utc)
        signed_at_ist = signed_at.astimezone(_IST)
        signed_at_str = signed_at_ist.strftime("%d %B %Y, %I:%M %p IST")

    html_content = template.render(
        soap_json=soap_json,
        sections=sections,
        doctor_name=doctor_name,
        letterhead=letterhead,
        logo_b64=logo_b64,
        is_signed=is_signed,
        signed_at=signed_at_str,
        pdf_footer=pdf_footer,
    )

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
