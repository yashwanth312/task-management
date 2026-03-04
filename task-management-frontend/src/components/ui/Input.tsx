import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`block w-full rounded-sm border bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors duration-150
          ${error
            ? "border-red-800 focus:border-red-500"
            : "border-[var(--border)] focus:border-amber-500/60 hover:border-[var(--border-hover)]"
          }
          focus:outline-none focus:ring-1 focus:ring-amber-500/20
          ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  )
);
Input.displayName = "Input";
