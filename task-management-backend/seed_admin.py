"""Run once to create the initial admin user.

Usage: python seed_admin.py
Requires DATABASE_URL to be set in .env
"""
import asyncio
import os
import sys

# Ensure the app package is importable from the project root
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


async def main() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@company.com")
    password = os.getenv("ADMIN_PASSWORD", "changeme123")
    name = os.getenv("ADMIN_NAME", "Admin User")

    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"Admin user {email} already exists.")
            return
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=name,
            role="admin",
        )
        db.add(user)
        await db.commit()
        print(f"Admin user created: {email} / {password}")


if __name__ == "__main__":
    asyncio.run(main())
