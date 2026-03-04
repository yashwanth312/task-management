import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    body: str


class CommentResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    body: str
    created_at: datetime
    author: UserResponse | None = None

    model_config = {"from_attributes": True}
