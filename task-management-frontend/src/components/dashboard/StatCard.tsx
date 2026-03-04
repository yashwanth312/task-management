interface StatCardProps {
  label: string;
  value: number;
  accent?: string;
  dimColor?: string;
  icon?: string;
}

export function StatCard({ label, value, accent, dimColor, icon }: StatCardProps) {
  return (
    <div
      className="relative rounded-sm p-5 group card-hover overflow-hidden animate-fade-slide"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top accent line */}
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: accent }}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p
            className="text-[9px] font-mono uppercase tracking-[0.12em]"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          {icon && (
            <span className="text-base opacity-50">{icon}</span>
          )}
        </div>

        <p
          className="text-4xl font-mono font-semibold leading-none tracking-tight"
          style={{ color: accent ?? "var(--text-primary)" }}
        >
          {value.toString().padStart(2, "0")}
        </p>

        {/* Subtle bottom indicator bar */}
        {dimColor && (
          <div
            className="h-0.5 rounded-full opacity-30"
            style={{ background: dimColor, width: `${Math.min(100, value * 10)}%`, minWidth: value > 0 ? "8%" : "0%" }}
          />
        )}
      </div>
    </div>
  );
}
