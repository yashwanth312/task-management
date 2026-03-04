import apiClient from "./client";
import { Comment, CommentCreate } from "@/types/comment";

export const listComments = async (taskId: string): Promise<Comment[]> => {
  const res = await apiClient.get<Comment[]>(`/tasks/${taskId}/comments`);
  return res.data;
};

export const createComment = async (taskId: string, data: CommentCreate): Promise<Comment> => {
  const res = await apiClient.post<Comment>(`/tasks/${taskId}/comments`, data);
  return res.data;
};

export const deleteComment = async (taskId: string, commentId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
};
