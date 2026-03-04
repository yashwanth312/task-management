import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate, TaskUpdate
from app.services.email_service import send_task_assigned_email, send_status_updated_email

router = APIRouter(prefix="/tasks", tags=["tasks"])

TASK_OPTIONS = (selectinload(Task.creator), selectinload(Task.assignee))


async def _get_task_or_404(task_id: uuid.UUID, db: AsyncSession) -> Task:
    result = await db.execute(
        select(Task).options(*TASK_OPTIONS).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status"),
    priority: str | None = None,
) -> list[Task]:
    query = select(Task).options(*TASK_OPTIONS)
    if current_user.role != "admin":
        query = query.where(Task.assigned_to == current_user.id)
    if status_filter:
        query = query.where(Task.status == status_filter)
    if priority:
        query = query.where(Task.priority == priority)
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Task:
    # Validate assignee exists
    assignee: User | None = None
    if body.assigned_to:
        result = await db.execute(select(User).where(User.id == body.assigned_to))
        assignee = result.scalar_one_or_none()
        if not assignee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")

    task = Task(
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
        assigned_to=body.assigned_to,
        created_by=current_user.id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    if assignee:
        send_task_assigned_email(
            background_tasks,
            assignee_email=assignee.email,
            assignee_name=assignee.full_name,
            task_title=task.title,
            task_id=str(task.id),
            frontend_url=settings.FRONTEND_URL,
        )

    return await _get_task_or_404(task.id, db)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Task:
    task = await _get_task_or_404(task_id, db)
    if current_user.role != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    background_tasks: BackgroundTasks,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Task:
    task = await _get_task_or_404(task_id, db)
    old_assignee_id = task.assigned_to

    # Validate new assignee if changing
    if body.assigned_to is not None and body.assigned_to != old_assignee_id:
        result = await db.execute(select(User).where(User.id == body.assigned_to))
        new_assignee = result.scalar_one_or_none()
        if not new_assignee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
        send_task_assigned_email(
            background_tasks,
            assignee_email=new_assignee.email,
            assignee_name=new_assignee.full_name,
            task_title=task.title,
            task_id=str(task.id),
            frontend_url=settings.FRONTEND_URL,
        )

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    return await _get_task_or_404(task_id, db)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: uuid.UUID,
    body: TaskStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Task:
    task = await _get_task_or_404(task_id, db)
    if current_user.role != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    task.status = body.status
    await db.commit()
    updated_task = await _get_task_or_404(task_id, db)

    # Notify creator
    if updated_task.creator and updated_task.creator.email != current_user.email:
        send_status_updated_email(
            background_tasks,
            creator_email=updated_task.creator.email,
            creator_name=updated_task.creator.full_name,
            task_title=updated_task.title,
            task_id=str(updated_task.id),
            new_status=body.status,
            updated_by=current_user.full_name,
            frontend_url=settings.FRONTEND_URL,
        )

    return updated_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    task = await _get_task_or_404(task_id, db)
    await db.delete(task)
    await db.commit()
