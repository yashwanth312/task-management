import uuid
from datetime import datetime, date
from typing import Literal

from pydantic import BaseModel

from app.schemas.user import UserResponse


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: date | None = None
    assigned_to: uuid.UUID | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: Literal["low", "medium", "high"] | None = None
    due_date: date | None = None
    assigned_to: uuid.UUID | None = None
    status: Literal["pending", "in_progress", "completed"] | None = None


class TaskStatusUpdate(BaseModel):
    status: Literal["pending", "in_progress", "completed"]


class TaskResponse(TaskBase):
    id: uuid.UUID
    status: Literal["pending", "in_progress", "completed"]
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    creator: UserResponse | None = None
    assignee: UserResponse | None = None

    model_config = {"from_attributes": True}
