"""
Shared fixtures for task management tests.
Uses FastAPI dependency overrides — no real DB required.
"""
import uuid
from datetime import datetime, timezone, date
from types import SimpleNamespace

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.dependencies.auth import get_current_user
from app.database import get_db

# ---------------------------------------------------------------------------
# Stable UUIDs shared across tests
# ---------------------------------------------------------------------------
EMPLOYEE_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
OTHER_ID    = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000002")

NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Lightweight mock objects that satisfy Pydantic's from_attributes serialiser
# ---------------------------------------------------------------------------
def make_user(user_id: uuid.UUID, role: str = "employee") -> SimpleNamespace:
    return SimpleNamespace(
        id=user_id,
        email=f"{user_id.hex[:6]}@test.com",
        full_name="Test User",
        role=role,
        job_title=None,
        is_active=True,
        terminated_at=None,
        created_at=NOW,
    )


def make_task(
    *,
    task_id: uuid.UUID | None = None,
    created_by: uuid.UUID,
    assigned_to: uuid.UUID | None,
) -> SimpleNamespace:
    tid = task_id or uuid.uuid4()
    creator = make_user(created_by)
    assignee = make_user(assigned_to) if assigned_to else None
    return SimpleNamespace(
        id=tid,
        title="Test task",
        description=None,
        status="pending",
        priority="medium",
        due_date=None,
        created_by=created_by,
        assigned_to=assigned_to,
        task_batch_id=None,
        created_at=NOW,
        updated_at=NOW,
        creator=creator,
        assignee=assignee,
        comments=[],
    )


# ---------------------------------------------------------------------------
# Smart mock DB session
#
# Strategy: compile the SQLAlchemy query to a SQL string and check whether
# it includes "created_by" in its WHERE clause.  This lets us distinguish
# the buggy filter (assigned_to only) from the fixed filter
# (assigned_to OR created_by) without a real database.
# ---------------------------------------------------------------------------
class MockResult:
    def __init__(self, items: list):
        self._items = items

    def scalars(self) -> "MockResult":
        return self

    def all(self) -> list:
        return self._items

    def scalar_one_or_none(self):
        return self._items[0] if self._items else None

    # support scalar_one() used by some queries
    def scalar_one(self):
        if not self._items:
            raise Exception("No result")
        return self._items[0]

    # support .first()
    def first(self):
        return self._items[0] if self._items else None


class SmartMockSession:
    """
    A mock AsyncSession that inspects the compiled SQL of each query.
    Pre-loaded with a list of task objects; filters them to simulate the
    DB-side WHERE clause the router would apply.
    """

    def __init__(self, tasks: list, current_user_id: uuid.UUID):
        self._tasks = tasks
        self._uid = current_user_id
        self.last_sql: str = ""

    async def execute(self, query):
        # Inspect ONLY the WHERE clause (not SELECT columns which always
        # include created_by / assigned_to column names and would confuse checks).
        try:
            where = query.whereclause
            where_str = str(where).lower() if where is not None else ""
        except Exception:
            where_str = ""

        self.last_sql = where_str

        # Determine which filter the router applied to the WHERE clause:
        if "created_by" in where_str and "assigned_to" in where_str:
            # Fixed: OR filter — return tasks where I'm creator OR assignee
            items = [
                t for t in self._tasks
                if t.assigned_to == self._uid or t.created_by == self._uid
            ]
        elif "assigned_to" in where_str and "created_by" not in where_str:
            # Buggy: only assigned_to filter
            items = [t for t in self._tasks if t.assigned_to == self._uid]
        else:
            # Any other query (e.g. single-task lookup by id) — return all tasks
            items = list(self._tasks)

        return MockResult(items)

    # No-op helpers so commit/refresh don't crash
    async def commit(self): pass
    async def refresh(self, obj): pass
    async def delete(self, obj): pass


# ---------------------------------------------------------------------------
# pytest fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def employee_user():
    return make_user(EMPLOYEE_ID, role="employee")


@pytest.fixture
def task_set():
    """
    Three tasks:
      A — created BY employee, assigned TO other (the problematic case)
      B — created BY other,    assigned TO employee (always visible)
      C — created BY other,    assigned TO other    (never visible to employee)
    """
    return {
        "A": make_task(created_by=EMPLOYEE_ID, assigned_to=OTHER_ID),
        "B": make_task(created_by=OTHER_ID,    assigned_to=EMPLOYEE_ID),
        "C": make_task(created_by=OTHER_ID,    assigned_to=OTHER_ID),
    }


@pytest_asyncio.fixture
async def client(employee_user, task_set):
    """AsyncClient with dependency overrides for an employee user."""
    all_tasks = list(task_set.values())
    session = SmartMockSession(all_tasks, EMPLOYEE_ID)

    async def override_user():
        return employee_user

    async def override_db():
        yield session

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac, session, task_set

    app.dependency_overrides.clear()
