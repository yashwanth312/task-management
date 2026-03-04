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
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "employee" } });

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => setOpen(true)}>+ Add Employee</Button>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role as UserRole}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.is_active ? "text-green-600" : "text-gray-400"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{format(new Date(u.created_at), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" {...register("full_name")} error={errors.full_name?.message} />
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          <Select label="Role" {...register("role")} error={errors.role?.message}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </Select>
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
