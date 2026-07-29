"""add_customizable_prompt_fields

Revision ID: 6a7b8c9d0e1f
Revises: 05a1b2c3d4e6
Create Date: 2026-07-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "6a7b8c9d0e1f"
down_revision = "f4a5b6c7d8e9"
branch_labels = None
depends_on = None

DEFAULT_OPENING_PERSONA = (
    "You are an expert medical scribe generating a clinical note "
    "from a doctor-patient conversation transcript."
)

DEFAULT_TRANSCRIPT_CONTEXT = (
    "You will receive a transcript of a doctor-patient interaction "
    "(already translated into English). Convert it into a detailed, "
    "professional clinical note following the sections below."
)

DEFAULT_STRICT_RULES = (
    "- Base every statement ONLY on information explicitly present in the transcript. "
    "Do NOT infer, assume, or fabricate any clinical detail, vital sign, history, "
    "or diagnosis that was not stated.\n"
    '- If a section has no corresponding information in the transcript, '
    'write "Not discussed" or "Not documented" for that section \u2014 '
    "do not guess or leave it blank.\n"
    "- Use standard clinical terminology and formatting a physician would expect "
    "in a medical record.\n"
    "- Do not include any commentary, disclaimers, or notes about the AI process itself. "
    "Output ONLY the clinical note."
)


def upgrade() -> None:
    op.add_column("doctor_report_templates", sa.Column("opening_persona", sa.Text(), nullable=True))
    op.add_column("doctor_report_templates", sa.Column("transcript_context", sa.Text(), nullable=True))
    op.add_column("doctor_report_templates", sa.Column("strict_rules", sa.Text(), nullable=True))

    op.execute(
        sa.text(
            "UPDATE doctor_report_templates SET "
            "opening_persona = :persona, "
            "transcript_context = :context, "
            "strict_rules = :rules "
            "WHERE opening_persona IS NULL"
        ).bindparams(persona=DEFAULT_OPENING_PERSONA, context=DEFAULT_TRANSCRIPT_CONTEXT, rules=DEFAULT_STRICT_RULES)
    )

    op.alter_column("doctor_report_templates", "opening_persona", nullable=False)
    op.alter_column("doctor_report_templates", "transcript_context", nullable=False)
    op.alter_column("doctor_report_templates", "strict_rules", nullable=False)


def downgrade() -> None:
    op.drop_column("doctor_report_templates", "strict_rules")
    op.drop_column("doctor_report_templates", "transcript_context")
    op.drop_column("doctor_report_templates", "opening_persona")
