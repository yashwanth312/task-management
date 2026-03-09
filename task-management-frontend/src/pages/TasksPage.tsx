import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/Button";
import { Task } from "@/types/task";

type Tab = "assigned" | "created";

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

function StatsStrip({ tasks }: { tasks: Task[] }) {
  const today = new Date().toISOString().split("T")[0];
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter(
      (t) => t.due_date && t.due_date < today && t.status !== "completed"
    ).length,
  };
  const completionPct =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div
      className="rounded-sm p-4 space-y-3 animate-fade-slide"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
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
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {label}
            </span>
            <span className="text-xs font-mono font-semibold" style={{ color }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Completion
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            {stats.completed} of {stats.total} tasks · {completionPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%`, background: "#10b981" }}
          />
        </div>
      </div>
    </div>
  );
}

export function TasksPage() {
  const [tab, setTab] = useState<Tab>("assigned");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const { data: allTasks = [], isLoading, error } = useTasks();

  // Admins see everything — tabs only apply to employees
  const assignedTasks = useMemo(
    () => allTasks.filter((t) => t.assigned_to === user?.id),
    [allTasks, user?.id]
  );
  const createdTasks = useMemo(
    () => allTasks.filter((t) => t.created_by === user?.id && t.assigned_to !== user?.id),
    [allTasks, user?.id]
  );

  // Deduplicate batch tasks — show one card per batch_id with a member count
  const deduplicateBatches = (tasks: Task[]): (Task & { batchCount?: number })[] => {
    const batchCounts = new Map<string, number>();
    for (const t of tasks) {
      if (t.task_batch_id) {
        batchCounts.set(t.task_batch_id, (batchCounts.get(t.task_batch_id) ?? 0) + 1);
      }
    }
    const seen = new Set<string>();
    const result: (Task & { batchCount?: number })[] = [];
    for (const t of tasks) {
      if (t.task_batch_id) {
        if (!seen.has(t.task_batch_id)) {
          seen.add(t.task_batch_id);
          result.push({ ...t, batchCount: batchCounts.get(t.task_batch_id) });
        }
      } else {
        result.push(t);
      }
    }
    return result;
  };

  const displayAllTasks = useMemo(() => deduplicateBatches(allTasks), [allTasks]);
  const displayCreatedTasks = useMemo(() => deduplicateBatches(createdTasks), [createdTasks]);

  // Unique assignees from individual tasks the employee created (for the dropdown)
  const assigneeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of createdTasks) {
      if (!t.task_batch_id && t.assignee && !seen.has(t.assignee.id)) {
        seen.set(t.assignee.id, t.assignee.full_name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [createdTasks]);

  // Admins use the deduplicated full list; employees split by tab
  const baseTasks = isAdmin ? displayAllTasks : (tab === "assigned" ? assignedTasks : displayCreatedTasks);

  // Apply status / priority / assignee filters
  const visibleTasks = useMemo(() => {
    let tasks = baseTasks;
    if (status) tasks = tasks.filter((t) => t.status === status);
    if (priority) tasks = tasks.filter((t) => t.priority === priority);
    if (tab === "created" && assigneeFilter)
      tasks = tasks.filter((t) => t.assigned_to === assigneeFilter);
    return tasks;
  }, [baseTasks, status, priority, assigneeFilter, tab]);

  const tabBase =
    "px-4 py-2 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-all duration-150 cursor-pointer";

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
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {isLoading
              ? "Loading…"
              : `${visibleTasks.length} task${visibleTasks.length !== 1 ? "s" : ""} ${status || priority || assigneeFilter ? "matching filters" : ""}`}
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

      {/* Tabs — employees only */}
      {!isAdmin && <div className="flex gap-2">
        {(["assigned", "created"] as Tab[]).map((t) => {
          const count = t === "assigned" ? assignedTasks.length : createdTasks.length;
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setAssigneeFilter(""); }}
              className={tabBase}
              style={
                active
                  ? { background: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent-border)" }
                  : { background: "var(--surface)", color: "var(--text-muted)", borderColor: "var(--border)" }
              }
            >
              {t === "assigned" ? "Assigned to Me" : "Created by Me"}
              <span
                className="ml-2 px-1.5 py-0.5 rounded-sm text-[9px] font-mono"
                style={{
                  background: active ? "rgba(245,158,11,0.15)" : "var(--surface-2)",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>}

      {/* Stats strip */}
      {!isLoading && baseTasks.length > 0 && <StatsStrip tasks={baseTasks} />}

      {/* Filters */}
      <div
        className="p-4 rounded-sm space-y-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <TaskFilters
          status={status}
          priority={priority}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
        />

        {/* Assignee filter — employees on Created tab only */}
        {!isAdmin && tab === "created" && assigneeOptions.length > 0 && (
          <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Assignee
            </span>
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setAssigneeFilter("")}
                className={tabBase}
                style={
                  assigneeFilter === ""
                    ? { background: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent-border)" }
                    : { background: "var(--surface)", color: "var(--text-muted)", borderColor: "var(--border)" }
                }
              >
                All
              </button>
              {assigneeOptions.map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAssigneeFilter(id)}
                  className={tabBase}
                  style={
                    assigneeFilter === id
                      ? { background: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent-border)" }
                      : { background: "var(--surface)", color: "var(--text-muted)", borderColor: "var(--border)" }
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && <LoadingSkeleton />}

      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-sm text-sm font-mono"
          style={{ background: "var(--red-muted)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        >
          <span>⚠</span> Failed to load tasks. Please try again.
        </div>
      )}

      {!isLoading && !error && visibleTasks.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-sm"
          style={{ border: "1px dashed var(--border)" }}
        >
          <p className="text-3xl font-mono font-semibold mb-2" style={{ color: "var(--border-hover)" }}>—</p>
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {isAdmin ? "No tasks found" : tab === "assigned" ? "No tasks assigned to you" : "No tasks created by you"}
          </p>
        </div>
      )}

      {visibleTasks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTasks.map((task, i) => (
            <div key={task.id} className={`animate-fade-slide stagger-${Math.min(i + 1, 5)}`}>
              <TaskCard task={task} currentUserId={user?.id} batchCount={"batchCount" in task ? (task as Task & { batchCount?: number }).batchCount : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
