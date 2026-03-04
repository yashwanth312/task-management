import apiClient from "./client";
import { Task, TaskCreate, TaskUpdate, TaskStatusUpdate } from "@/types/task";

export const listTasks = async (params?: { status?: string; priority?: string }): Promise<Task[]> => {
  const res = await apiClient.get<Task[]>("/tasks", { params });
  return res.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const res = await apiClient.get<Task>(`/tasks/${id}`);
  return res.data;
};

export const createTask = async (data: TaskCreate): Promise<Task> => {
  const res = await apiClient.post<Task>("/tasks", data);
  return res.data;
};

export const updateTask = async (id: string, data: TaskUpdate): Promise<Task> => {
  const res = await apiClient.patch<Task>(`/tasks/${id}`, data);
  return res.data;
};

export const updateTaskStatus = async (id: string, data: TaskStatusUpdate): Promise<Task> => {
  const res = await apiClient.patch<Task>(`/tasks/${id}/status`, data);
  return res.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};
