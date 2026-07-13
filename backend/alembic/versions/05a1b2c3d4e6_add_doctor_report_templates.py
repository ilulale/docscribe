"""add_doctor_report_templates

Revision ID: 05a1b2c3d4e6
Revises: d1a2b3c4d5e6
Create Date: 2026-07-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "05a1b2c3d4e6"
down_revision = "d1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "doctor_report_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("doctors.id"), unique=True, nullable=False),
        sa.Column("sections", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("pdf_footer", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("doctor_report_templates")
