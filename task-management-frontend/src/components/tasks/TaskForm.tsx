import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof schema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  employees: User[];
  onSubmit: (data: TaskFormValues) => Promise<void>;
  submitLabel?: string;
}

export function TaskForm({ defaultValues, employees, onSubmit, submitLabel = "Save" }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      priority: defaultValues?.priority ?? "medium",
      due_date: defaultValues?.due_date ?? "",
      assigned_to: defaultValues?.assigned_to ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title" {...register("title")} error={errors.title?.message} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <Select label="Priority" {...register("priority")} error={errors.priority?.message}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
      <Input label="Due Date" type="date" {...register("due_date")} />
      <Select label="Assign To" {...register("assigned_to")}>
        <option value="">Unassigned</option>
        {employees.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name} ({u.email})
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
