import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.group import Group
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskBatchMemberStatus, TaskCreate, TaskResponse, TaskStatusUpdate, TaskUpdate
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


@router.get("/batch/{batch_id}", response_model=list[TaskBatchMemberStatus])
async def get_task_batch(
    batch_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    result = await db.execute(
        select(Task).options(*TASK_OPTIONS).where(Task.task_batch_id == batch_id)
    )
    tasks = list(result.scalars().all())
    if not tasks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    # Employees can only see batch if they are a member
    if current_user.role != "admin":
        member_ids = {t.assigned_to for t in tasks}
        if current_user.id not in member_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return [
        {"task_id": t.id, "assignee": t.assignee, "status": t.status, "updated_at": t.updated_at}
        for t in tasks
    ]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Task:
    # Group fanout
    if body.group_id:
        result = await db.execute(
            select(Group).where(Group.id == body.group_id)
        )
        group = result.scalar_one_or_none()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

        active_members = [m for m in group.members if m.is_active]
        if not active_members:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No active members in this group",
            )

        batch_id = uuid.uuid4()
        first_task: Task | None = None
        for member in active_members:
            task = Task(
                title=body.title,
                description=body.description,
                priority=body.priority,
                due_date=body.due_date,
                assigned_to=member.id,
                created_by=current_user.id,
                task_batch_id=batch_id,
            )
            db.add(task)
            if first_task is None:
                first_task = task

        await db.commit()

        # Reload and send emails
        for member in active_members:
            result2 = await db.execute(
                select(Task)
                .options(*TASK_OPTIONS)
                .where(Task.task_batch_id == batch_id, Task.assigned_to == member.id)
            )
            t = result2.scalar_one_or_none()
            if t:
                send_task_assigned_email(
                    background_tasks,
                    assignee_email=member.email,
                    assignee_name=member.full_name,
                    task_title=t.title,
                    task_id=str(t.id),
                    frontend_url=settings.FRONTEND_URL,
                )

        # Return first task
        result3 = await db.execute(
            select(Task)
            .options(*TASK_OPTIONS)
            .where(Task.task_batch_id == batch_id)
            .order_by(Task.created_at)
        )
        return result3.scalars().first()  # type: ignore[return-value]

    # Individual assignment
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
