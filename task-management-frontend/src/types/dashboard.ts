export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

export interface EmployeeTaskCount {
  user_id: string;
  full_name: string;
  email: string;
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export interface DashboardStats {
  task_stats: TaskStats;
  tasks_per_employee: EmployeeTaskCount[];
}
