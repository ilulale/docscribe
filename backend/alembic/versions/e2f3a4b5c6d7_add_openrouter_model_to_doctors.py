"""add openrouter_model to doctors

Revision ID: e2f3a4b5c6d7
Revises: d1a2b3c4d5e6
Create Date: 2026-07-28 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, None] = '05a1b2c3d4e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'doctors',
        sa.Column('openrouter_model', sa.String(255), nullable=False, server_default='google/gemini-3.1-flash-lite'),
    )
    op.execute(
        "UPDATE doctors SET openrouter_model = 'google/gemini-3.1-flash-lite' WHERE openrouter_model IS NULL"
    )


def downgrade() -> None:
    op.drop_column('doctors', 'openrouter_model')
