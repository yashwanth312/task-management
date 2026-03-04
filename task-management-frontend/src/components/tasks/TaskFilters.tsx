interface TaskFiltersProps {
  status: string;
  priority: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
}

const filterBase =
  "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-all duration-150 cursor-pointer";

interface ChipProps {
  label: string;
  value: string;
  active: boolean;
  activeColor?: string;
  activeBg?: string;
  activeBorder?: string;
  onClick: () => void;
}

function Chip({ label, value: _value, active, activeColor, activeBg, activeBorder, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={filterBase}
      style={
        active
          ? {
              background: activeBg ?? "var(--accent-muted)",
              color: activeColor ?? "var(--accent)",
              borderColor: activeBorder ?? "var(--accent-border)",
            }
          : {
              background: "var(--surface)",
              color: "var(--text-muted)",
              borderColor: "var(--border)",
            }
      }
    >
      {label}
    </button>
  );
}

const statusOptions = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  { value: "in_progress", label: "In Progress", color: "#14b8a6", bg: "rgba(20,184,166,0.1)", border: "rgba(20,184,166,0.3)" },
  { value: "completed", label: "Completed", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
];

const priorityOptions = [
  { value: "", label: "All" },
  { value: "high", label: "High", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  { value: "medium", label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  { value: "low", label: "Low", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)" },
];

export function TaskFilters({ status, priority, onStatusChange, onPriorityChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Status
        </span>
        <div className="flex gap-1">
          {statusOptions.map((opt) => (
            <Chip
              key={opt.value}
              value={opt.value}
              label={opt.label}
              active={status === opt.value}
              activeColor={opt.color}
              activeBg={opt.bg}
              activeBorder={opt.border}
              onClick={() => onStatusChange(opt.value)}
            />
          ))}
        </div>
      </div>

      <div
        className="w-px self-stretch"
        style={{ background: "var(--border)" }}
      />

      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Priority
        </span>
        <div className="flex gap-1">
          {priorityOptions.map((opt) => (
            <Chip
              key={opt.value}
              value={opt.value}
              label={opt.label}
              active={priority === opt.value}
              activeColor={opt.color}
              activeBg={opt.bg}
              activeBorder={opt.border}
              onClick={() => onPriorityChange(opt.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
