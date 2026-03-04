from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.task import Task
from app.models.user import User
from app.schemas.dashboard import DashboardStats, TaskStats, EmployeeTaskCount

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStats:
    today = date.today()

    # Overall task aggregations
    stats_result = await db.execute(
        select(
            func.count(Task.id).label("total"),
            func.sum(case((Task.status == "pending", 1), else_=0)).label("pending"),
            func.sum(case((Task.status == "in_progress", 1), else_=0)).label("in_progress"),
            func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
            func.sum(
                case(
                    (
                        (Task.due_date < today) & (Task.status != "completed"),
                        1,
                    ),
                    else_=0,
                )
            ).label("overdue"),
        )
    )
    row = stats_result.one()
    task_stats = TaskStats(
        total=row.total or 0,
        pending=row.pending or 0,
        in_progress=row.in_progress or 0,
        completed=row.completed or 0,
        overdue=row.overdue or 0,
    )

    # Per-employee breakdown (only employees with at least one task)
    per_employee_result = await db.execute(
        select(
            User.id.label("user_id"),
            User.full_name,
            User.email,
            func.count(Task.id).label("total"),
            func.sum(case((Task.status == "pending", 1), else_=0)).label("pending"),
            func.sum(case((Task.status == "in_progress", 1), else_=0)).label("in_progress"),
            func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
        )
        .join(Task, Task.assigned_to == User.id)
        .where(User.role == "employee")
        .group_by(User.id, User.full_name, User.email)
        .order_by(User.full_name)
    )

    tasks_per_employee = [
        EmployeeTaskCount(
            user_id=str(r.user_id),
            full_name=r.full_name,
            email=r.email,
            total=r.total or 0,
            pending=r.pending or 0,
            in_progress=r.in_progress or 0,
            completed=r.completed or 0,
        )
        for r in per_employee_result.all()
    ]

    return DashboardStats(task_stats=task_stats, tasks_per_employee=tasks_per_employee)
