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

export function TaskForm({
  defaultValues,
  employees,
  onSubmit,
  submitLabel = "Save",
}: TaskFormProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Title"
        placeholder="Task title…"
        {...register("title")}
        error={errors.title?.message}
      />

      <div className="space-y-1.5">
        <label
          className="block text-[10px] font-mono font-medium uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Description
        </label>
        <textarea
          {...register("description")}
          rows={4}
          placeholder="Describe this task…"
          className="block w-full rounded-sm border px-3 py-2.5 text-sm transition-colors duration-150 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/20"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          {...register("priority")}
          error={errors.priority?.message}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>

        <Input
          label="Due Date"
          type="date"
          {...register("due_date")}
        />
      </div>

      <Select label="Assign To" {...register("assigned_to")}>
        <option value="">Unassigned</option>
        {employees.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name} ({u.email})
          </option>
        ))}
      </Select>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border border-black/40 border-t-black/80 rounded-full animate-spin" />
              Saving…
            </span>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
