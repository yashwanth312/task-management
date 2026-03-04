import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-sm shimmer" />
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-sm shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-sm shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-sm text-sm font-mono"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171",
        }}
      >
        <span>⚠</span> Failed to load dashboard.
      </div>
    );
  }

  if (!data) return null;

  const { task_stats: s, tasks_per_employee } = data;

  const stats = [
    { label: "Total", value: s.total, accent: "var(--text-primary)", dimColor: "var(--text-secondary)" },
    { label: "Pending", value: s.pending, accent: "#f59e0b", dimColor: "#f59e0b", icon: "○" },
    { label: "In Progress", value: s.in_progress, accent: "#14b8a6", dimColor: "#14b8a6", icon: "◐" },
    { label: "Completed", value: s.completed, accent: "#10b981", dimColor: "#10b981", icon: "●" },
    { label: "Overdue", value: s.overdue, accent: "#ef4444", dimColor: "#ef4444", icon: "!" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-slide">
        <h1
          className="text-2xl font-mono font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard
        </h1>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Operations overview — all employees
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stagger-${i + 1}`}>
            <StatCard
              label={stat.label}
              value={stat.value}
              accent={stat.accent}
              dimColor={stat.dimColor}
              icon={stat.icon}
            />
          </div>
        ))}
      </div>

      {/* Employee table */}
      <div className="space-y-3 animate-fade-slide stagger-3">
        <div className="flex items-center justify-between">
          <h2
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Tasks per Employee
          </h2>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {tasks_per_employee.length} members
          </span>
        </div>

        {tasks_per_employee.length === 0 ? (
          <div
            className="flex items-center justify-center py-16 rounded-sm"
            style={{ border: "1px dashed var(--border)" }}
          >
            <p
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              No tasks assigned yet
            </p>
          </div>
        ) : (
          <div
            className="rounded-sm overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  {["Employee", "Total", "Pending", "In Progress", "Completed"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks_per_employee.map((emp) => {
                  const completionPct = emp.total > 0
                    ? Math.round((emp.completed / emp.total) * 100)
                    : 0;
                  return (
                    <tr key={emp.user_id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-mono font-semibold flex-shrink-0"
                            style={{
                              background: "var(--surface-3)",
                              color: "var(--accent)",
                              border: "1px solid var(--border-hover)",
                            }}
                          >
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p
                              className="text-xs font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {emp.full_name}
                            </p>
                            <p
                              className="text-[10px] font-mono"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {emp.total}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-amber-400">{emp.pending}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-teal-400">{emp.in_progress}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-emerald-400">{emp.completed}</span>
                          {emp.total > 0 && (
                            <div
                              className="flex-1 h-1 rounded-full overflow-hidden max-w-[60px]"
                              style={{ background: "var(--surface-3)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${completionPct}%`,
                                  background: "#10b981",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
