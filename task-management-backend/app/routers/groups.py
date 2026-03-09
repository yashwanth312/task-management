import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.group import Group, group_members
from app.models.user import User
from app.schemas.group import GroupCreate, GroupMembersUpdate, GroupResponse, GroupUpdate

router = APIRouter(prefix="/groups", tags=["groups"])


async def _get_group_or_404(group_id: uuid.UUID, db: AsyncSession) -> Group:
    result = await db.execute(
        select(Group).options(selectinload(Group.members)).where(Group.id == group_id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group


@router.get("", response_model=list[GroupResponse])
async def list_groups(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Group]:
    result = await db.execute(
        select(Group).options(selectinload(Group.members)).order_by(Group.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: GroupCreate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Group:
    group = Group(
        name=body.name,
        description=body.description,
        created_by=current_user.id,
    )
    db.add(group)
    await db.flush()  # Get group.id before inserting members

    if body.member_ids:
        await db.execute(
            insert(group_members).values(
                [{"group_id": group.id, "user_id": uid} for uid in body.member_ids]
            ).on_conflict_do_nothing()
        )

    await db.commit()
    return await _get_group_or_404(group.id, db)


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Group:
    return await _get_group_or_404(group_id, db)


@router.patch("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: uuid.UUID,
    body: GroupUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Group:
    group = await _get_group_or_404(group_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(group, field, value)
    await db.commit()
    return await _get_group_or_404(group_id, db)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    group = await _get_group_or_404(group_id, db)
    await db.delete(group)
    await db.commit()


@router.put("/{group_id}/members", response_model=GroupResponse)
async def replace_group_members(
    group_id: uuid.UUID,
    body: GroupMembersUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Group:
    await _get_group_or_404(group_id, db)
    # Delete all existing members
    await db.execute(delete(group_members).where(group_members.c.group_id == group_id))
    # Insert new members
    if body.member_ids:
        await db.execute(
            insert(group_members).values(
                [{"group_id": group_id, "user_id": uid} for uid in body.member_ids]
            ).on_conflict_do_nothing()
        )
    await db.commit()
    return await _get_group_or_404(group_id, db)


@router.post("/{group_id}/members/{user_id}", response_model=GroupResponse)
async def add_group_member(
    group_id: uuid.UUID,
    user_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Group:
    await _get_group_or_404(group_id, db)
    await db.execute(
        insert(group_members)
        .values(group_id=group_id, user_id=user_id)
        .prefix_with("ON CONFLICT DO NOTHING")
    )
    await db.commit()
    return await _get_group_or_404(group_id, db)


@router.delete("/{group_id}/members/{user_id}", response_model=GroupResponse)
async def remove_group_member(
    group_id: uuid.UUID,
    user_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Group:
    await _get_group_or_404(group_id, db)
    await db.execute(
        delete(group_members).where(
            group_members.c.group_id == group_id,
            group_members.c.user_id == user_id,
        )
    )
    await db.commit()
    return await _get_group_or_404(group_id, db)
