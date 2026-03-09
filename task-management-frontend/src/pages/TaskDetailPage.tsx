import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { useTask, useUpdateTaskStatus, useDeleteTask, useTaskBatch } from "@/hooks/useTasks";
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
  const { data: batchMembers = [] } = useTaskBatch(task?.task_batch_id ?? null);

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-10 w-2/3 rounded-sm shimmer" />
        <div className="h-48 rounded-sm shimmer" />
        <div className="h-32 rounded-sm shimmer" />
      </div>
    );
  }

  if (!task) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-sm text-sm font-mono"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171",
        }}
      >
        <span>⚠</span> Task not found.
      </div>
    );
  }

  const canUpdateStatus = user?.role === "admin" || task.assigned_to === user?.id;

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ status: status as TaskStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task? This action cannot be undone.")) return;
    await deleteTask.mutateAsync(task.id);
    navigate("/tasks");
  };

  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date();

  return (
    <div className="max-w-3xl space-y-5 animate-fade-slide">
      {/* Back nav */}
      <Link
        to="/tasks"
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        ← Back to Tasks
      </Link>

      {/* Task header card */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {/* Top accent */}
        <div
          className="h-px"
          style={{
            background:
              task.priority === "high"
                ? "#ef4444"
                : task.priority === "medium"
                ? "#f59e0b"
                : "var(--border-hover)",
          }}
        />

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <h1
                className="text-xl font-mono font-semibold leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={task.status}>{task.status.replace("_", " ")}</Badge>
                <Badge variant={task.priority}>{task.priority}</Badge>
                {isOverdue && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    Overdue
                  </span>
                )}
              </div>
            </div>

            {(user?.role === "admin" || task.created_by === user?.id) && (
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/tasks/${task.id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                {user?.role === "admin" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteTask.isPending}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          {task.description && (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Meta grid */}
        <div
          className="grid grid-cols-2 gap-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            { label: "Assigned to", value: task.assignee?.full_name ?? "Unassigned" },
            { label: "Created by", value: task.creator?.full_name ?? "—" },
            {
              label: "Due date",
              value: task.due_date
                ? format(new Date(task.due_date), "MMM d, yyyy")
                : "—",
              highlight: isOverdue,
            },
            {
              label: "Last updated",
              value: format(new Date(task.updated_at), "MMM d, yyyy HH:mm"),
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className="px-6 py-4"
              style={{
                borderBottom: i < 2 ? "1px solid var(--border)" : undefined,
                borderRight: i % 2 === 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              <dt
                className="text-[9px] font-mono uppercase tracking-widest mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {item.label}
              </dt>
              <dd
                className="text-sm font-medium"
                style={{ color: item.highlight ? "#f87171" : "var(--text-primary)" }}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </div>

        {/* Status update */}
        {canUpdateStatus && (
          <div
            className="px-6 py-4 flex items-center gap-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="text-[9px] font-mono uppercase tracking-widest flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              Update Status
            </span>
            <Select
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

      {/* Group batch overview */}
      {task.task_batch_id && batchMembers.length > 0 && (user?.role === "admin" || task.created_by === user?.id || batchMembers.some((m) => m.assignee?.id === user?.id)) && (
        <div
          className="rounded-sm overflow-hidden animate-fade-slide"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Group Overview
            </h2>
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {batchMembers.length} member{batchMembers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                {["Member", "Job Title", "Status", "Last Updated"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batchMembers.map((m) => (
                <tr key={m.task_id}>
                  <td>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {m.assignee?.full_name ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {m.assignee?.job_title ?? "—"}
                    </span>
                  </td>
                  <td>
                    <Badge variant={m.status}>{m.status.replace("_", " ")}</Badge>
                  </td>
                  <td>
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(m.updated_at), "MMM d, HH:mm")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comments section */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Comments
          </h2>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {comments.length}
          </span>
        </div>
        <div className="p-6 space-y-4">
          <CommentList
            comments={comments}
            onDelete={(cid) => deleteComment.mutate(cid)}
            isDeleting={deleteComment.isPending}
          />
          <AddComment
            onAdd={async (body) => { await createComment.mutateAsync({ body }); }}
            isAdding={createComment.isPending}
          />
        </div>
      </div>
    </div>
  );
}
