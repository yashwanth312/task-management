import { useNavigate } from "react-router-dom";
import { useCreateTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { TaskForm, TaskFormValues } from "@/components/tasks/TaskForm";

export function CreateTaskPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask();
  const { data: users = [] } = useUsers();
  const employees = users.filter((u) => u.role === "employee" && u.is_active);

  const handleSubmit = async (data: TaskFormValues) => {
    const task = await createTask.mutateAsync({
      title: data.title,
      description: data.description,
      priority: data.priority,
      due_date: data.due_date || undefined,
      assigned_to: data.assigned_to || undefined,
    });
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div className="max-w-xl animate-fade-slide">
      <div className="mb-8">
        <h1
          className="text-2xl font-mono font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          New Task
        </h1>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Create and assign a new task to your team.
        </p>
      </div>

      <div
        className="rounded-sm overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div
          className="h-px"
          style={{ background: "linear-gradient(to right, var(--accent), transparent)" }}
        />
        <div className="p-6">
          <TaskForm
            employees={employees}
            onSubmit={handleSubmit}
            submitLabel="Create Task →"
          />
        </div>
      </div>
    </div>
  );
}
