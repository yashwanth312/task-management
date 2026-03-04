import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask } from "@/api/tasks";
import { TaskCreate, TaskUpdate, TaskStatusUpdate } from "@/types/task";

export const TASKS_KEY = ["tasks"] as const;

export function useTasks(params?: { status?: string; priority?: string }) {
  return useQuery({
    queryKey: [...TASKS_KEY, params],
    queryFn: () => listTasks(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: [...TASKS_KEY, id],
    queryFn: () => getTask(id),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => createTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskUpdate) => updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTaskStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskStatusUpdate) => updateTaskStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
