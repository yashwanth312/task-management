import { useNavigate, useParams } from "react-router-dom";
import { useTask, useUpdateTask } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { TaskForm, TaskFormValues } from "@/components/tasks/TaskForm";

export function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const updateTask = useUpdateTask(id!);
  const { data: users = [] } = useUsers();
  const employees = users.filter((u) => u.role === "employee" && u.is_active);

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="h-8 w-32 rounded-sm shimmer" />
        <div className="h-72 rounded-sm shimmer" />
      </div>
    );
  }

  if (!task) {
    return (
      <p
        className="text-sm font-mono"
        style={{ color: "#f87171" }}
      >
        Task not found.
      </p>
    );
  }

  const handleSubmit = async (data: TaskFormValues) => {
    await updateTask.mutateAsync({
      title: data.title,
      description: data.description,
      priority: data.priority,
      due_date: data.due_date || undefined,
      assigned_to: data.assigned_to || undefined,
    });
    navigate(`/tasks/${id}`);
  };

  return (
    <div className="max-w-xl animate-fade-slide">
      <div className="mb-8">
        <h1
          className="text-2xl font-mono font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Edit Task
        </h1>
        <p
          className="text-xs mt-1 font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          #{id?.slice(0, 8)}
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
            defaultValues={task}
            employees={employees}
            groups={[]}
            editMode={true}
            onSubmit={handleSubmit}
            submitLabel="Save Changes →"
          />
        </div>
      </div>
    </div>
  );
}
