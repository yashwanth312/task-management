import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <Navbar />
      <main
        className="ml-60 pt-14"
        style={{ minHeight: "100vh" }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
