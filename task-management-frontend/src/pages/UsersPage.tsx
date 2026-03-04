import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { UserRole } from "@/types/user";

const schema = z.object({
  full_name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "employee"]),
  password: z.string().min(6, "Min 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function UsersPage() {
  const [open, setOpen] = useState(false);
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "employee" },
  });

  const onSubmit = async (data: FormValues) => {
    await createUser.mutateAsync(data);
    reset();
    setOpen(false);
  };

  const toggleActive = (id: string, is_active: boolean) => {
    updateUser.mutate({ id, data: { is_active: !is_active } });
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
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {users.length} team member{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          Add Employee
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-sm shimmer" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div
          className="rounded-sm overflow-hidden animate-fade-slide stagger-1"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`animate-fade-slide stagger-${Math.min(i + 1, 5)}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0"
                        style={{
                          background: u.is_active ? "var(--accent-muted)" : "var(--surface-3)",
                          color: u.is_active ? "var(--accent)" : "var(--text-muted)",
                          border: `1px solid ${u.is_active ? "var(--accent-border)" : "var(--border)"}`,
                        }}
                      >
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {u.full_name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-[11px]">{u.email}</span>
                  </td>
                  <td>
                    <Badge variant={u.role as UserRole}>{u.role}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: u.is_active ? "#10b981" : "var(--text-muted)",
                        }}
                      />
                      <span
                        className="text-[10px] font-mono uppercase tracking-wide"
                        style={{
                          color: u.is_active ? "#10b981" : "var(--text-muted)",
                        }}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-[10px]">
                      {format(new Date(u.created_at), "MMM d, yyyy")}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(u.id, u.is_active)}
                      disabled={updateUser.isPending}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Employee"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
