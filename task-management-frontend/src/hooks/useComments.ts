import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listComments, createComment, deleteComment } from "@/api/comments";
import { CommentCreate } from "@/types/comment";

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => listComments(taskId),
  });
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CommentCreate) => createComment(taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
  });
}
