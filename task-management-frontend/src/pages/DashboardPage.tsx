import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <p className="text-gray-500">Loading dashboard…</p>;
  if (error) return <p className="text-red-600">Failed to load dashboard.</p>;
  if (!data) return null;

  const { task_stats: s, tasks_per_employee } = data;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total Tasks" value={s.total} />
        <StatCard label="Pending" value={s.pending} color="text-yellow-600" />
        <StatCard label="In Progress" value={s.in_progress} color="text-blue-600" />
        <StatCard label="Completed" value={s.completed} color="text-green-600" />
        <StatCard label="Overdue" value={s.overdue} color="text-red-600" />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Tasks per Employee</h2>
        {tasks_per_employee.length === 0 ? (
          <p className="text-gray-500">No tasks assigned yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Employee", "Total", "Pending", "In Progress", "Completed"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks_per_employee.map((emp) => (
                  <tr key={emp.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {emp.full_name}
                      <span className="ml-1 text-gray-400 font-normal">({emp.email})</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{emp.total}</td>
                    <td className="px-4 py-3 text-yellow-600">{emp.pending}</td>
                    <td className="px-4 py-3 text-blue-600">{emp.in_progress}</td>
                    <td className="px-4 py-3 text-green-600">{emp.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
