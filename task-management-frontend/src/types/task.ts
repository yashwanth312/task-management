import { User } from "./user";

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  creator: User | null;
  assignee: User | null;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  status?: TaskStatus;
}

export interface TaskStatusUpdate {
  status: TaskStatus;
}
