import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[10px] font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`block w-full rounded-sm border px-3 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-amber-500/20 appearance-none ${className}`}
        style={{
          background: "var(--surface-2)",
          color: "var(--text-primary)",
          borderColor: error ? "#7f1d1d" : "var(--border)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%234e4e62' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          backgroundSize: "20px",
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  )
);
Select.displayName = "Select";
