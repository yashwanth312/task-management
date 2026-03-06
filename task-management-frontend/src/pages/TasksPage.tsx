import { useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/Button";

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-36 rounded-sm shimmer"
          style={{ border: "1px solid var(--border)" }}
        />
      ))}
    </div>
  );
}

export function TasksPage() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const { data: tasks, isLoading, error } = useTasks(
    Object.fromEntries(
      Object.entries({
        status: status || undefined,
        priority: priority || undefined,
      }).filter(([, v]) => v !== undefined)
    )
  );

  const today = new Date().toISOString().split("T")[0];

  const stats = tasks
    ? {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        overdue: tasks.filter(
          (t) => t.due_date && t.due_date < today && t.status !== "completed"
        ).length,
      }
    : null;

  const completionPct =
    stats && stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-mono font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            My Tasks
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {tasks
              ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""} ${status || priority ? "matching filters" : "assigned to you"}`
              : "Loading…"}
          </p>
        </div>

        <Link to="/tasks/new">
          <Button size="sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 1v10M1 6h10" strokeLinecap="round" />
            </svg>
            New Task
          </Button>
        </Link>
      </div>

      {/* Stats strip */}
      {stats && stats.total > 0 && (
        <div
          className="rounded-sm p-4 space-y-3 animate-fade-slide"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Stat chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Pending", value: stats.pending, color: "#f59e0b" },
              { label: "In Progress", value: stats.in_progress, color: "#14b8a6" },
              { label: "Completed", value: stats.completed, color: "#10b981" },
              { label: "Overdue", value: stats.overdue, color: "#ef4444" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {label}
                </span>
                <span className="text-xs font-mono font-semibold" style={{ color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Completion progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Completion
              </span>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {stats.completed} of {stats.total} tasks · {completionPct}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--surface-3)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%`, background: "#10b981" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="p-4 rounded-sm"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <TaskFilters
          status={status}
          priority={priority}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
        />
      </div>

      {/* Content */}
      {isLoading && <LoadingSkeleton />}

      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-sm text-sm font-mono"
          style={{
            background: "var(--red-muted)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          <span>⚠</span> Failed to load tasks. Please try again.
        </div>
      )}

      {!isLoading && !error && tasks?.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-sm"
          style={{ border: "1px dashed var(--border)" }}
        >
          <p
            className="text-3xl font-mono font-semibold mb-2"
            style={{ color: "var(--border-hover)" }}
          >
            —
          </p>
          <p
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            No tasks found
          </p>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={`animate-fade-slide stagger-${Math.min(i + 1, 5)}`}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
