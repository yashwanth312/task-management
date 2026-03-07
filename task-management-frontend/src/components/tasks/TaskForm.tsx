import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, endOfMonth, endOfWeek, format } from "date-fns";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import { Group } from "@/types/group";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getTemplatesForJobTitle } from "@/config/taskTemplates";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional(),
  due_preset: z.enum(["today", "tomorrow", "this_week", "this_month", "custom"]).default("custom"),
  assigned_to: z.string().optional(),
  assign_mode: z.enum(["individual", "group"]).default("individual"),
  group_id: z.string().optional(),
  template_id: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof schema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  employees: User[];
  groups?: Group[];
  editMode?: boolean;
  creatorJobTitle?: string | null;
  onSubmit: (data: TaskFormValues) => Promise<void>;
  submitLabel?: string;
}

const PRESET_LABELS: Array<{ key: "today" | "tomorrow" | "this_week" | "this_month" | "custom"; label: string; priority: "low" | "medium" | "high" | null }> = [
  { key: "today", label: "Today", priority: "high" },
  { key: "tomorrow", label: "Tomorrow", priority: "high" },
  { key: "this_week", label: "This Week", priority: "medium" },
  { key: "this_month", label: "This Month", priority: "low" },
  { key: "custom", label: "Custom", priority: null },
];

function getPresetDate(preset: string): string | undefined {
  const now = new Date();
  switch (preset) {
    case "today": return format(now, "yyyy-MM-dd");
    case "tomorrow": return format(addDays(now, 1), "yyyy-MM-dd");
    case "this_week": return format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    case "this_month": return format(endOfMonth(now), "yyyy-MM-dd");
    default: return undefined;
  }
}

export function TaskForm({
  defaultValues,
  employees,
  groups = [],
  editMode = false,
  creatorJobTitle = null,
  onSubmit,
  submitLabel = "Save",
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      priority: defaultValues?.priority ?? "medium",
      due_date: defaultValues?.due_date ?? "",
      due_preset: "custom",
      assigned_to: defaultValues?.assigned_to ?? "",
      assign_mode: "individual",
      group_id: "",
      template_id: "custom",
    },
  });

  const duePreset = watch("due_preset");
  const assignMode = watch("assign_mode");
  const templateId = watch("template_id");

  // Auto-set priority and due_date from preset
  useEffect(() => {
    const preset = PRESET_LABELS.find((p) => p.key === duePreset);
    if (preset && preset.priority) {
      setValue("priority", preset.priority);
    }
    const date = getPresetDate(duePreset);
    if (date) {
      setValue("due_date", date);
    }
  }, [duePreset, setValue]);

  // Templates are based on the creator's own job_title
  const templates = useMemo(() => getTemplatesForJobTitle(creatorJobTitle), [creatorJobTitle]);

  // Pre-fill title/description when template changes
  useEffect(() => {
    if (!templateId || templateId === "custom") return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setValue("title", tpl.title);
      setValue("description", tpl.description);
    }
  }, [templateId, templates, setValue]);

  const autoPriority = PRESET_LABELS.find((p) => p.key === duePreset)?.priority;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Template picker — only shown when creator has matching job_title templates */}
      {!editMode && templates.length > 0 && (
        <div className="space-y-2">
          <label
            className="block text-[10px] font-mono font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Template
          </label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                {...register("template_id")}
                value="custom"
                className="accent-amber-500"
              />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Custom (blank)
              </span>
            </label>
            {templates.map((tpl) => (
              <label key={tpl.id} className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  {...register("template_id")}
                  value={tpl.id}
                  className="accent-amber-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {tpl.label}
                  </span>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {tpl.title}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Assignment mode toggle — hidden in edit mode */}
      {!editMode && (
        <div className="space-y-2">
          <label
            className="block text-[10px] font-mono font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Assign To
          </label>
          <div className="flex gap-2">
            {(["individual", ...(groups.length > 0 ? ["group"] : [])] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setValue("assign_mode", mode as "individual" | "group")}
                className="px-3 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wide transition-all"
                style={{
                  background: assignMode === mode ? "var(--accent)" : "var(--surface-2)",
                  color: assignMode === mode ? "black" : "var(--text-secondary)",
                  border: `1px solid ${assignMode === mode ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {assignMode === "individual" ? (
            <Select {...register("assigned_to")}>
              <option value="">Unassigned</option>
              {employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}{u.job_title ? ` — ${u.job_title}` : ""}
                </option>
              ))}
            </Select>
          ) : (
            <Select {...register("group_id")} error={errors.group_id?.message}>
              <option value="">Select group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.members.length} member{g.members.length !== 1 ? "s" : ""})
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* Title */}
      <Input
        label="Title"
        placeholder="Task title…"
        {...register("title")}
        error={errors.title?.message}
      />

      {/* Description */}
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
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
      </div>

      {/* Due date chips */}
      <div className="space-y-2">
        <label
          className="block text-[10px] font-mono font-medium uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Due Date
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LABELS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setValue("due_preset", p.key)}
              className="px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wide transition-all"
              style={{
                background: duePreset === p.key ? "var(--accent)" : "var(--surface-2)",
                color: duePreset === p.key ? "black" : "var(--text-secondary)",
                border: `1px solid ${duePreset === p.key ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {duePreset === "custom" ? (
          <Input type="date" {...register("due_date")} />
        ) : (
          <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
            {getPresetDate(duePreset)}
          </p>
        )}
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <label
          className="block text-[10px] font-mono font-medium uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Priority
        </label>
        {autoPriority && duePreset !== "custom" ? (
          <div className="flex items-center gap-2">
            <Badge variant={autoPriority}>{autoPriority}</Badge>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              (auto-set)
            </span>
          </div>
        ) : (
          <Select {...register("priority")} error={errors.priority?.message}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        )}
      </div>

      {/* Assignee field for edit mode */}
      {editMode && (
        <Select label="Assign To" {...register("assigned_to")}>
          <option value="">Unassigned</option>
          {employees.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}{u.job_title ? ` — ${u.job_title}` : ""}
            </option>
          ))}
        </Select>
      )}

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
