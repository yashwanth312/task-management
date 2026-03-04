import { useState } from "react";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, useUpdateGroupMembers } from "@/hooks/useGroups";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Group } from "@/types/group";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  member_ids: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

export function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  const { data: groups = [], isLoading } = useGroups();
  const { data: users = [] } = useUsers();
  const employees = users.filter((u) => u.role === "employee" && u.is_active);

  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const updateGroupMembers = useUpdateGroupMembers();

  const {
    register: regCreate,
    handleSubmit: hsCreate,
    reset: resetCreate,
    watch: watchCreate,
    setValue: setValueCreate,
    formState: { errors: errCreate, isSubmitting: isSubmCreate },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { member_ids: [] },
  });

  const {
    register: regEdit,
    handleSubmit: hsEdit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    formState: { errors: errEdit, isSubmitting: isSubmEdit },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { member_ids: [] },
  });

  const createMemberIds = watchCreate("member_ids");
  const editMemberIds = watchEdit("member_ids");

  const onCreateSubmit = async (data: FormValues) => {
    await createGroup.mutateAsync({
      name: data.name,
      description: data.description,
      member_ids: data.member_ids,
    });
    resetCreate({ member_ids: [] });
    setCreateOpen(false);
  };

  const openEdit = (g: Group) => {
    setEditGroup(g);
    resetEdit({
      name: g.name,
      description: g.description ?? "",
      member_ids: g.members.map((m) => m.id),
    });
  };

  const onEditSubmit = async (data: FormValues) => {
    if (!editGroup) return;
    await updateGroup.mutateAsync({ id: editGroup.id, data: { name: data.name, description: data.description } });
    await updateGroupMembers.mutateAsync({ id: editGroup.id, data: { member_ids: data.member_ids } });
    setEditGroup(null);
  };

  const handleDelete = async (g: Group) => {
    if (!confirm(`Delete group "${g.name}"? Existing batch tasks will not be affected.`)) return;
    await deleteGroup.mutateAsync(g.id);
  };

  const toggleMember = (id: string, current: string[], setter: (ids: string[]) => void) => {
    setter(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
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
            Groups
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {groups.length} group{groups.length !== 1 ? "s" : ""} — assign tasks to multiple members at once
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          New Group
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-sm shimmer" />
          ))}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div
          className="rounded-sm p-8 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <p className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
            No groups yet. Create one to assign tasks to multiple employees at once.
          </p>
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <div
          className="rounded-sm overflow-hidden animate-fade-slide stagger-1"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                {["Name", "Description", "Members", "Created", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={g.id} className={`animate-fade-slide stagger-${Math.min(i + 1, 5)}`}>
                  <td>
                    <span className="text-xs font-medium font-mono" style={{ color: "var(--text-primary)" }}>
                      {g.name}
                    </span>
                  </td>
                  <td>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {g.description ?? "—"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {g.members.length === 0 ? (
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          No members
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {g.members.map((m) => m.full_name).join(", ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-[10px]">
                      {format(new Date(g.created_at), "MMM d, yyyy")}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(g)}
                        disabled={deleteGroup.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Group">
        <form onSubmit={hsCreate(onCreateSubmit)} className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. Engineering Team"
            {...regCreate("name")}
            error={errCreate.name?.message}
          />
          <Input
            label="Description (optional)"
            placeholder="What does this group do?"
            {...regCreate("description")}
          />
          <div className="space-y-2">
            <label
              className="block text-[10px] font-mono font-medium uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Members
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createMemberIds.includes(emp.id)}
                    onChange={() => toggleMember(emp.id, createMemberIds, (ids) => setValueCreate("member_ids", ids))}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {emp.full_name}
                    </span>
                    {emp.job_title && (
                      <span className="ml-2 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {emp.job_title}
                      </span>
                    )}
                  </div>
                </label>
              ))}
              {employees.length === 0 && (
                <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  No active employees.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmCreate}>
              {isSubmCreate ? "Creating…" : "Create Group"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editGroup} onClose={() => setEditGroup(null)} title="Edit Group">
        <form onSubmit={hsEdit(onEditSubmit)} className="space-y-4">
          <Input
            label="Group Name"
            {...regEdit("name")}
            error={errEdit.name?.message}
          />
          <Input
            label="Description (optional)"
            {...regEdit("description")}
          />
          <div className="space-y-2">
            <label
              className="block text-[10px] font-mono font-medium uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Members
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editMemberIds.includes(emp.id)}
                    onChange={() => toggleMember(emp.id, editMemberIds, (ids) => setValueEdit("member_ids", ids))}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {emp.full_name}
                    </span>
                    {emp.job_title && (
                      <span className="ml-2 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {emp.job_title}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditGroup(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmEdit}>
              {isSubmEdit ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
