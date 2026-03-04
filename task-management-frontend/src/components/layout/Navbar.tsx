import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="fixed top-0 left-64 right-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <span className="text-sm text-gray-500">
        Welcome, <span className="font-medium text-gray-800">{user?.full_name}</span>
      </span>
      <Button variant="ghost" size="sm" onClick={logout}>
        Sign out
      </Button>
    </header>
  );
}
