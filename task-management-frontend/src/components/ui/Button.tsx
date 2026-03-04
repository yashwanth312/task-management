import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center font-medium font-sans tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed select-none";

const variants = {
  primary:
    "bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600 border border-amber-500 hover:border-amber-400 rounded-sm",
  secondary:
    "bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-sm",
  danger:
    "bg-transparent text-red-400 border border-red-900 hover:bg-red-950 hover:border-red-700 hover:text-red-300 rounded-sm",
  ghost:
    "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-sm border border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
