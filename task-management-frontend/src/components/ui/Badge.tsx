import { ReactNode } from "react";

const variants = {
  pending:
    "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  in_progress:
    "bg-teal-500/10 text-teal-400 border border-teal-500/25",
  completed:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  low:
    "bg-white/5 text-[var(--text-muted)] border border-white/8",
  medium:
    "bg-amber-500/8 text-amber-500/80 border border-amber-500/20",
  high:
    "bg-red-500/10 text-red-400 border border-red-500/25",
  admin:
    "bg-violet-500/10 text-violet-400 border border-violet-500/25",
  employee:
    "bg-white/5 text-[var(--text-secondary)] border border-white/8",
};

const dots: Record<string, string> = {
  pending: "bg-amber-400",
  in_progress: "bg-teal-400",
  completed: "bg-emerald-400",
  low: "bg-gray-500",
  medium: "bg-amber-500",
  high: "bg-red-400",
  admin: "bg-violet-400",
  employee: "bg-gray-500",
};

type BadgeVariant = keyof typeof variants;

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium uppercase tracking-wider ${variants[variant]}`}
    >
      <span className={`status-dot ${dots[variant]}`} />
      {children}
    </span>
  );
}
