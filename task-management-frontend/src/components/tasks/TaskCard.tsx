import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Task } from "@/types/task";
import { Badge } from "@/components/ui/Badge";

export function TaskCard({ task }: { task: Task }) {
  const statusLabel = task.status.replace("_", " ");
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date();

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900 line-clamp-2">{task.title}</h3>
        <Badge variant={task.status}>{statusLabel}</Badge>
      </div>
      {task.description && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <Badge variant={task.priority}>{task.priority}</Badge>
        {task.assignee && (
          <span className="text-xs text-gray-500">Assigned: {task.assignee.full_name}</span>
        )}
        {task.due_date && (
          <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
            Due: {format(new Date(task.due_date), "MMM d, yyyy")}
            {isOverdue && " (overdue)"}
          </span>
        )}
      </div>
    </Link>
  );
}
