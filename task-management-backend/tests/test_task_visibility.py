"""
Tests for the employee task-visibility bug.

BEFORE fix: employees can only see tasks assigned to them.
AFTER fix:  employees can see tasks assigned to them OR created by them.

Three endpoints are covered:
  1. GET /tasks  — list view
  2. GET /tasks/{id} — single task detail
  3. PATCH /tasks/{id}/status — status updates remain assignee-or-admin only
"""
import pytest

from tests.conftest import EMPLOYEE_ID, OTHER_ID


# ---------------------------------------------------------------------------
# 1. GET /tasks — list view
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_list_tasks_includes_tasks_created_by_employee(client):
    """
    An employee who creates a task (assigned to someone else) must see it
    in their task list so they can track its progress.
    """
    ac, session, tasks = client
    task_A = tasks["A"]   # created_by=EMPLOYEE, assigned_to=OTHER
    task_B = tasks["B"]   # created_by=OTHER,    assigned_to=EMPLOYEE

    response = await ac.get("/tasks")

    assert response.status_code == 200
    ids = [t["id"] for t in response.json()]

    # Task created by employee must appear
    assert str(task_A.id) in ids, (
        "Task A (created by employee, assigned to other) should be visible"
    )
    # Task assigned to employee must still appear
    assert str(task_B.id) in ids, (
        "Task B (assigned to employee) should still be visible"
    )


@pytest.mark.asyncio
async def test_list_tasks_excludes_unrelated_tasks(client):
    """
    Tasks where the employee is neither creator nor assignee must not appear.
    """
    ac, session, tasks = client
    task_C = tasks["C"]   # created_by=OTHER, assigned_to=OTHER

    response = await ac.get("/tasks")

    assert response.status_code == 200
    ids = [t["id"] for t in response.json()]

    assert str(task_C.id) not in ids, (
        "Task C (unrelated to employee) must not appear in their task list"
    )


# ---------------------------------------------------------------------------
# 2. GET /tasks/{id} — single task access
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_task_created_by_employee_returns_200(client):
    """
    An employee must be able to fetch the detail of a task they created
    (even if assigned to someone else) — to track progress / view comments.
    """
    ac, session, tasks = client
    task_A = tasks["A"]   # created_by=EMPLOYEE, assigned_to=OTHER

    # Override session to return only task_A for single-task lookup
    from tests.conftest import SmartMockSession
    single_session = SmartMockSession([task_A], EMPLOYEE_ID)

    from app.main import app
    from app.dependencies.auth import get_current_user
    from app.database import get_db
    from tests.conftest import make_user

    async def override_user():
        return make_user(EMPLOYEE_ID, role="employee")

    async def override_db():
        yield single_session

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db

    from httpx import AsyncClient, ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac2:
        response = await ac2.get(f"/tasks/{task_A.id}")

    app.dependency_overrides.clear()

    assert response.status_code == 200, (
        f"Employee should be able to view a task they created. Got {response.status_code}: {response.text}"
    )
    assert response.json()["id"] == str(task_A.id)


@pytest.mark.asyncio
async def test_get_task_unrelated_to_employee_returns_403(client):
    """
    An employee must NOT be able to fetch a task where they are neither
    creator nor assignee.
    """
    ac, session, tasks = client
    task_C = tasks["C"]   # created_by=OTHER, assigned_to=OTHER

    from tests.conftest import SmartMockSession
    single_session = SmartMockSession([task_C], EMPLOYEE_ID)

    from app.main import app
    from app.dependencies.auth import get_current_user
    from app.database import get_db
    from tests.conftest import make_user

    async def override_user():
        return make_user(EMPLOYEE_ID, role="employee")

    async def override_db():
        yield single_session

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db

    from httpx import AsyncClient, ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac2:
        response = await ac2.get(f"/tasks/{task_C.id}")

    app.dependency_overrides.clear()

    assert response.status_code == 403, (
        f"Employee should NOT access an unrelated task. Got {response.status_code}"
    )


# ---------------------------------------------------------------------------
# 3. PATCH /tasks/{id}/status — status update remains assignee-or-admin only
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_creator_cannot_update_status_of_task_they_only_created(client):
    """
    If an employee created a task (assigned to someone else), they can VIEW
    it but must NOT be able to change its status — that's the assignee's job.
    """
    ac, session, tasks = client
    task_A = tasks["A"]   # created_by=EMPLOYEE, assigned_to=OTHER

    from tests.conftest import SmartMockSession
    single_session = SmartMockSession([task_A], EMPLOYEE_ID)

    from app.main import app
    from app.dependencies.auth import get_current_user
    from app.database import get_db
    from tests.conftest import make_user

    async def override_user():
        return make_user(EMPLOYEE_ID, role="employee")

    async def override_db():
        yield single_session

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db] = override_db

    from httpx import AsyncClient, ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac2:
        response = await ac2.patch(
            f"/tasks/{task_A.id}/status",
            json={"status": "completed"},
        )

    app.dependency_overrides.clear()

    assert response.status_code == 403, (
        "Creator-only (non-assignee) employee must NOT update task status"
    )
