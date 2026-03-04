import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserResponse


class GroupCreate(BaseModel):
    name: str
    description: str | None = None
    member_ids: list[uuid.UUID] = []


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class GroupMembersUpdate(BaseModel):
    member_ids: list[uuid.UUID]


class GroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    created_by: uuid.UUID | None = None
    created_at: datetime
    members: list[UserResponse] = []

    model_config = {"from_attributes": True}
