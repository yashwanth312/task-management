import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header
      className="fixed top-0 left-60 right-0 z-30 flex h-14 items-center justify-between px-8"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Welcome back,
        </span>
        <span
          className="text-xs font-mono font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {user?.full_name}
        </span>
        {user?.role === "admin" && (
          <span
            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}
          >
            Admin
          </span>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={logout}>
        Sign out
      </Button>
    </header>
  );
}
