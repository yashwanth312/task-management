import logging
from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

from app.config import settings

logger = logging.getLogger(__name__)

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fastmail = FastMail(mail_config)


async def _send_email(subject: str, recipients: list[str], body: str) -> None:
    if not settings.MAIL_USERNAME:
        logger.info("Email not configured, skipping send. Subject: %s, To: %s", subject, recipients)
        return
    try:
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=MessageType.html,
        )
        await fastmail.send_message(message)
    except Exception:
        logger.exception("Failed to send email to %s", recipients)


def send_task_assigned_email(
    background_tasks: BackgroundTasks,
    assignee_email: str,
    assignee_name: str,
    task_title: str,
    task_id: str,
    frontend_url: str,
) -> None:
    subject = f"New task assigned: {task_title}"
    body = f"""
    <p>Hi {assignee_name},</p>
    <p>You have been assigned a new task: <strong>{task_title}</strong></p>
    <p><a href="{frontend_url}/tasks/{task_id}">View Task</a></p>
    <p>Task Management System</p>
    """
    background_tasks.add_task(_send_email, subject, [assignee_email], body)


def send_status_updated_email(
    background_tasks: BackgroundTasks,
    creator_email: str,
    creator_name: str,
    task_title: str,
    task_id: str,
    new_status: str,
    updated_by: str,
    frontend_url: str,
) -> None:
    subject = f"Task status updated: {task_title}"
    body = f"""
    <p>Hi {creator_name},</p>
    <p>The task <strong>{task_title}</strong> has been updated to <strong>{new_status.replace('_', ' ')}</strong> by {updated_by}.</p>
    <p><a href="{frontend_url}/tasks/{task_id}">View Task</a></p>
    <p>Task Management System</p>
    """
    background_tasks.add_task(_send_email, subject, [creator_email], body)
