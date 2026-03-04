from pydantic import BaseModel


class TaskStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    completed: int
    overdue: int


class EmployeeTaskCount(BaseModel):
    user_id: str
    full_name: str
    email: str
    total: int
    pending: int
    in_progress: int
    completed: int


class DashboardStats(BaseModel):
    task_stats: TaskStats
    tasks_per_employee: list[EmployeeTaskCount]
