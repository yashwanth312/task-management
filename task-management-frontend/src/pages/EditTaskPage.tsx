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

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (!task) return <p className="text-red-600">Task not found.</p>;

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
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Task</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <TaskForm
          defaultValues={task}
          employees={employees}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
