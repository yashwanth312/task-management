import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/tasks", label: "Tasks", icon: "📋" },
  { to: "/dashboard", label: "Dashboard", adminOnly: true, icon: "📊" },
  { to: "/users", label: "Users", adminOnly: true, icon: "👥" },
];

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <span className="text-lg font-bold text-indigo-600">TaskHub</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className="border-t border-gray-200 px-4 py-4">
        <p className="text-xs text-gray-500">{user?.email}</p>
        <p className="text-xs font-medium text-gray-700 capitalize">{user?.role}</p>
      </div>
    </aside>
  );
}
