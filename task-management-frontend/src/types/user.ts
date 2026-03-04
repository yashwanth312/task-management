export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  job_title: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  role: UserRole;
  password: string;
  job_title?: string;
}

export interface UserUpdate {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  job_title?: string;
}
