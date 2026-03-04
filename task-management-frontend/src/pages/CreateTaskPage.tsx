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
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Task</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <TaskForm employees={employees} onSubmit={handleSubmit} submitLabel="Create Task" />
      </div>
    </div>
  );
}
