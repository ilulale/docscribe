"""add sequence number to sessions

Revision ID: d1a2b3c4d5e6
Revises: cbad0d08ba69
Create Date: 2026-07-13 08:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1a2b3c4d5e6'
down_revision: Union[str, None] = 'cbad0d08ba69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('sessions', sa.Column('sequence_number', sa.Integer(), nullable=True))
    op.execute("""
        UPDATE sessions SET sequence_number = sub.rn
        FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY doctor_id ORDER BY created_at) AS rn
            FROM sessions
        ) AS sub
        WHERE sessions.id = sub.id
    """)
    op.alter_column('sessions', 'sequence_number', nullable=False)


def downgrade() -> None:
    op.drop_column('sessions', 'sequence_number')
