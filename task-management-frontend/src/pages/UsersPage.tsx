import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useTerminateUser } from "@/hooks/useUsers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { User, UserRole } from "@/types/user";

// ── Add Employee form ──────────────────────────────────────────────────
const addSchema = z.object({
  full_name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "employee"]),
  password: z.string().min(6, "Min 6 characters"),
  job_title: z.string().optional(),
});
type AddFormValues = z.infer<typeof addSchema>;

// ── Edit Employee form ─────────────────────────────────────────────────
const editSchema = z.object({
  full_name: z.string().min(1, "Name required"),
  job_title: z.string().optional(),
  role: z.enum(["admin", "employee"]),
});
type EditFormValues = z.infer<typeof editSchema>;

// ── Edit modal sub-component ───────────────────────────────────────────
function EditModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: user.full_name,
      job_title: user.job_title ?? "",
      role: user.role,
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    await updateUser.mutateAsync({
      id: user.id,
      data: {
        full_name: data.full_name,
        job_title: data.job_title?.trim() || null,
        role: data.role as UserRole,
      },
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Edit Employee">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Jane Smith"
          {...register("full_name")}
          error={errors.full_name?.message}
        />
        {/* Email shown as read-only context */}
        <div className="space-y-1.5">
          <label
            className="block text-[10px] font-mono font-medium uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Email (read-only)
          </label>
          <p
            className="text-xs font-mono px-3 py-2.5 rounded-sm"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            {user.email}
          </p>
        </div>
        <Input
          label="Job Title (optional)"
          placeholder="e.g. ERP Consultant"
          {...register("job_title")}
        />
        <Select label="Role" {...register("role")} error={errors.role?.message}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export function UsersPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmTerminateId, setConfirmTerminateId] = useState<string | null>(null);
  const [showTerminated, setShowTerminated] = useState(false);

  const { data: users = [], isLoading } = useUsers();
  const visibleUsers = showTerminated ? users : users.filter((u) => !u.terminated_at);
  const terminatedCount = users.filter((u) => !!u.terminated_at).length;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const terminateUser = useTerminateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { role: "employee" },
  });

  const onAdd = async (data: AddFormValues) => {
    await createUser.mutateAsync(data);
    reset();
    setAddOpen(false);
  };

  const toggleActive = (id: string, is_active: boolean) => {
    updateUser.mutate({ id, data: { is_active: !is_active } });
  };

  const handleTerminate = (id: string) => {
    terminateUser.mutate(id, {
      onSuccess: () => setConfirmTerminateId(null),
      onError: () => setConfirmTerminateId(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-slide">
        <div>
          <h1
            className="text-2xl font-mono font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Users
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {visibleUsers.length} team member{visibleUsers.length !== 1 ? "s" : ""}
            {terminatedCount > 0 && !showTerminated && (
              <span> · {terminatedCount} terminated</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {terminatedCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowTerminated((v) => !v)}>
              {showTerminated ? "Hide terminated" : "Show terminated"}
            </Button>
          )}
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          Add Employee
        </Button>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-sm shimmer" />
          ))}
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div
          className="rounded-sm overflow-hidden animate-fade-slide stagger-1"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                {["Name", "Job Title", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u, i) => {
                const isTerminated = !!u.terminated_at;
                return (
                  <tr
                    key={u.id}
                    className={`animate-fade-slide stagger-${Math.min(i + 1, 5)}`}
                    style={isTerminated ? { borderLeft: "2px solid rgba(185,28,28,0.5)" } : undefined}
                  >
                    {/* Name */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0"
                          style={{
                            background: isTerminated
                              ? "rgba(239,68,68,0.1)"
                              : u.is_active
                              ? "var(--accent-muted)"
                              : "var(--surface-3)",
                            color: isTerminated
                              ? "rgb(248,113,113)"
                              : u.is_active
                              ? "var(--accent)"
                              : "var(--text-muted)",
                            border: `1px solid ${
                              isTerminated
                                ? "rgba(239,68,68,0.25)"
                                : u.is_active
                                ? "var(--accent-border)"
                                : "var(--border)"
                            }`,
                          }}
                        >
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: isTerminated ? "var(--text-muted)" : "var(--text-primary)",
                            textDecoration: isTerminated ? "line-through" : "none",
                          }}
                        >
                          {u.full_name}
                        </span>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td>
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {u.job_title ?? "—"}
                      </span>
                    </td>

                    {/* Email */}
                    <td>
                      <span className="font-mono text-[11px]">{u.email}</span>
                    </td>

                    {/* Role */}
                    <td>
                      <Badge variant={u.role as UserRole}>{u.role}</Badge>
                    </td>

                    {/* Status */}
                    <td>
                      {isTerminated ? (
                        <Badge variant="terminated">Terminated</Badge>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: u.is_active ? "#10b981" : "var(--text-muted)" }}
                          />
                          <span
                            className="text-[10px] font-mono uppercase tracking-wide"
                            style={{ color: u.is_active ? "#10b981" : "var(--text-muted)" }}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Joined */}
                    <td>
                      <span className="font-mono text-[10px]">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      {isTerminated ? (
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          —
                        </span>
                      ) : confirmTerminateId === u.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                            Confirm terminate?
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminate(u.id)}
                            disabled={terminateUser.isPending}
                            style={{ color: "rgb(248,113,113)" }}
                          >
                            Yes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmTerminateId(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditUser(u)}
                          >
                            Edit
                          </Button>
                          {/* Deactivate / Activate */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(u.id, u.is_active)}
                            disabled={updateUser.isPending}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          {/* Terminate — only shown when inactive and not terminated */}
                          {!u.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmTerminateId(u.id)}
                              style={{ color: "rgb(248,113,113)" }}
                            >
                              Terminate
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employee modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Employee">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            {...register("full_name")}
            error={errors.full_name?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@company.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <Select label="Role" {...register("role")} error={errors.role?.message}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </Select>
          <Input
            label="Job Title (optional)"
            placeholder="e.g. Software Engineer"
            {...register("job_title")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Employee"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee modal */}
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
}
