import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Task } from "@/types/task";
import { Badge } from "@/components/ui/Badge";

const priorityAccent: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#4e4e62",
};

export function TaskCard({ task, currentUserId, batchCount }: { task: Task; currentUserId?: string; batchCount?: number }) {
  const statusLabel = task.status.replace("_", " ");
  const isCreatedByMe = currentUserId && task.created_by === currentUserId && task.assigned_to !== currentUserId;
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date();

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-sm card-hover animate-fade-slide group overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Priority left border */}
      <div className="flex">
        <div
          className="w-0.5 flex-shrink-0 transition-opacity duration-150 group-hover:opacity-100 opacity-60"
          style={{ background: priorityAccent[task.priority] }}
        />

        <div className="flex-1 p-4 space-y-3 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--text-primary)] transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {task.title}
            </h3>
            <div className="flex-shrink-0">
              <Badge variant={task.status}>{statusLabel}</Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p
              className="text-xs line-clamp-2 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div
            className="flex items-center gap-3 flex-wrap pt-1"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Badge variant={task.priority}>{task.priority}</Badge>

            {isCreatedByMe && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  color: "var(--accent)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                created
              </span>
            )}

            {batchCount != null ? (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                style={{
                  background: "rgba(20,184,166,0.1)",
                  color: "#14b8a6",
                  border: "1px solid rgba(20,184,166,0.2)",
                }}
              >
                Group · {batchCount} members
              </span>
            ) : task.assignee && (
              <span
                className="text-[10px] font-mono truncate max-w-[120px]"
                style={{ color: "var(--text-muted)" }}
                title={task.assignee.full_name}
              >
                → {task.assignee.full_name}
              </span>
            )}

            {task.due_date && (
              <span
                className={`text-[10px] font-mono ml-auto flex-shrink-0 ${isOverdue ? "font-medium" : ""}`}
                style={{ color: isOverdue ? "#f87171" : "var(--text-muted)" }}
              >
                {isOverdue && "⚠ "}
                {format(new Date(task.due_date), "MMM d")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
