"""Add groups, job_title, task_batch_id

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-04

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add job_title to users
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255)")

    # Add task_batch_id to tasks
    op.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_batch_id UUID")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tasks_task_batch_id ON tasks (task_batch_id)")

    # Create groups table
    op.execute("""
        CREATE TABLE IF NOT EXISTS groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    # Create group_members join table
    op.execute("""
        CREATE TABLE IF NOT EXISTS group_members (
            group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (group_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_group_members_user_id ON group_members (user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS group_members")
    op.execute("DROP TABLE IF EXISTS groups")
    op.execute("DROP INDEX IF EXISTS ix_tasks_task_batch_id")
    op.execute("ALTER TABLE tasks DROP COLUMN IF EXISTS task_batch_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS job_title")
