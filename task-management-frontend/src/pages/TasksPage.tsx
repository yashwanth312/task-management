import { useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/Button";

export function TasksPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const { data: tasks, isLoading, error } = useTasks(
    Object.fromEntries(
      Object.entries({ status: status || undefined, priority: priority || undefined }).filter(
        ([, v]) => v !== undefined
      )
    )
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        {user?.role === "admin" && (
          <Link to="/tasks/new">
            <Button>+ New Task</Button>
          </Link>
        )}
      </div>
      <div className="mb-4">
        <TaskFilters
          status={status}
          priority={priority}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
        />
      </div>
      {isLoading && <p className="text-gray-500">Loading tasks…</p>}
      {error && <p className="text-red-600">Failed to load tasks.</p>}
      {tasks && tasks.length === 0 && (
        <p className="text-gray-500">No tasks found.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks?.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
