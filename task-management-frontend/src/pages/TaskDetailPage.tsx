import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { useTask, useUpdateTaskStatus, useDeleteTask } from "@/hooks/useTasks";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CommentList } from "@/components/comments/CommentList";
import { AddComment } from "@/components/comments/AddComment";
import { TaskStatus } from "@/types/task";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: task, isLoading } = useTask(id!);
  const { data: comments = [] } = useComments(id!);
  const updateStatus = useUpdateTaskStatus(id!);
  const deleteTask = useDeleteTask();
  const createComment = useCreateComment(id!);
  const deleteComment = useDeleteComment(id!);

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (!task) return <p className="text-red-600">Task not found.</p>;

  const canUpdateStatus = user?.role === "admin" || task.assigned_to === user?.id;

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ status: status as TaskStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    await deleteTask.mutateAsync(task.id);
    navigate("/tasks");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={task.status}>{task.status.replace("_", " ")}</Badge>
            <Badge variant={task.priority}>{task.priority}</Badge>
          </div>
        </div>
        {user?.role === "admin" && (
          <div className="flex gap-2 shrink-0">
            <Link to={`/tasks/${task.id}/edit`}>
              <Button variant="secondary" size="sm">Edit</Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteTask.isPending}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        {task.description && <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Assigned to</dt>
            <dd className="text-gray-900">{task.assignee?.full_name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Created by</dt>
            <dd className="text-gray-900">{task.creator?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Due date</dt>
            <dd className="text-gray-900">
              {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Updated</dt>
            <dd className="text-gray-900">{format(new Date(task.updated_at), "MMM d, yyyy HH:mm")}</dd>
          </div>
        </dl>
        {canUpdateStatus && (
          <div className="pt-2 border-t border-gray-100">
            <Select
              label="Update Status"
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updateStatus.isPending}
              className="w-48"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Comments</h2>
        <CommentList
          comments={comments}
          onDelete={(cid) => deleteComment.mutate(cid)}
          isDeleting={deleteComment.isPending}
        />
        <AddComment
          onAdd={(body) => createComment.mutateAsync({ body })}
          isAdding={createComment.isPending}
        />
      </div>
    </div>
  );
}
