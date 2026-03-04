import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  {
    to: "/tasks",
    label: "Tasks",
    adminOnly: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="12" height="12" rx="1" />
        <path d="M4 5h6M4 7h6M4 9h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    adminOnly: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="7" width="3" height="6" rx="0.5" />
        <rect x="5.5" y="4" width="3" height="9" rx="0.5" />
        <rect x="10" y="1" width="3" height="12" rx="0.5" />
      </svg>
    ),
  },
  {
    to: "/users",
    label: "Users",
    adminOnly: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="5" cy="4.5" r="2" />
        <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round" />
        <path d="M9.5 7a2.5 2.5 0 100-5M13 12c0-2-1.3-3.5-3-3.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center px-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 flex items-center justify-center rounded-sm"
            style={{ background: "var(--accent)", flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2h8v2H2zM2 5.5h6v2H2zM2 9h4v2H2z" fill="black" />
            </svg>
          </div>
          <span className="font-mono font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
            TaskHub
          </span>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <span
          className="text-[9px] font-mono uppercase tracking-[0.12em]"
          style={{ color: "var(--text-muted)" }}
        >
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-all duration-150 group animate-slide-left stagger-${i + 1}
                ${isActive
                  ? "text-black"
                  : "hover:bg-[var(--surface-2)]"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "var(--accent)", color: "black" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <span className="flex-shrink-0 opacity-80">{item.icon}</span>
              <span className="font-sans">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* User info */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0"
            style={{
              background: "var(--surface-3)",
              color: "var(--accent)",
              border: "1px solid var(--border-hover)",
            }}
          >
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.full_name}
            </p>
            <p
              className="text-[10px] font-mono truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
