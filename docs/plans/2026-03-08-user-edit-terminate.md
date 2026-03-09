# User Edit & Termination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to edit user profiles (name, job title, role) and irreversibly terminate employees (soft-delete via `terminated_at` timestamp) — termination is only allowed after the user is deactivated.

**Architecture:** New Alembic migration adds `terminated_at` to `users`. A new `POST /users/{id}/terminate` endpoint enforces the deactivate-first rule. The frontend gains an Edit modal and in-row Terminate flow in `UsersPage`; no new pages.

**Tech Stack:** Python 3.12 / FastAPI / SQLAlchemy async / Alembic; React 18 / TypeScript / React Hook Form / Zod / TanStack Query v5

---

## Task 1: Backend — Add `terminated_at` column (migration)

**Files:**
- Create: `task-management-backend/migrations/versions/0003_terminated_at.py`
- Modify: `task-management-backend/app/models/user.py`

### Step 1: Create the migration file

Create `task-management-backend/migrations/versions/0003_terminated_at.py` with this exact content:

```python
"""Add terminated_at to users

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-08

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ NULL DEFAULT NULL"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS terminated_at")
```

### Step 2: Add the column to the SQLAlchemy model

In `task-management-backend/app/models/user.py`, add the import for `timezone` (already present) and add this column after the `is_active` line:

```python
terminated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
```

Full updated model columns (for reference — do not change relationships):
```python
id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
full_name: Mapped[str] = mapped_column(String(255), nullable=False)
role: Mapped[str] = mapped_column(SAEnum("admin", "employee", name="user_role"), nullable=False, default="employee")
job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
terminated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

### Step 3: Apply the migration

```bash
cd task-management-backend
PYTHONPATH=. .venv/Scripts/alembic upgrade head
```

Expected output: `Running upgrade 0002 -> 0003, Add terminated_at to users`

### Step 4: Commit

```bash
git add task-management-backend/migrations/versions/0003_terminated_at.py task-management-backend/app/models/user.py
git commit -m "feat: add terminated_at column to users"
```

---

## Task 2: Backend — Update schemas and add terminate endpoint

**Files:**
- Modify: `task-management-backend/app/schemas/user.py`
- Modify: `task-management-backend/app/routers/users.py`

### Step 1: Add `terminated_at` to `UserResponse`

In `task-management-backend/app/schemas/user.py`, add `terminated_at` to `UserResponse`:

```python
class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    terminated_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
```

Also ensure `datetime` is imported at the top (it already is).

### Step 2: Add guard on `PATCH /users/{user_id}` for terminated users

In `task-management-backend/app/routers/users.py`, update the `update_user` function. After the user is fetched and confirmed to exist, add a check before applying updates:

```python
@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.terminated_at is not None and body.is_active is True:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Terminated users cannot be reactivated",
        )
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user
```

### Step 3: Add the `POST /users/{user_id}/terminate` endpoint

Add this new endpoint to `task-management-backend/app/routers/users.py` after the `update_user` function. It needs `datetime` and `timezone` imported — add `from datetime import datetime, timezone` at the top of the file if not already present (check the existing imports first).

```python
@router.post("/{user_id}/terminate", response_model=UserResponse)
async def terminate_user(
    user_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Deactivate the user before terminating",
        )
    if user.terminated_at is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="User is already terminated",
        )
    user.terminated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return user
```

### Step 4: Verify the backend starts without errors

```bash
cd task-management-backend
PYTHONPATH=. .venv/Scripts/uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` and confirm:
- `PATCH /users/{user_id}` is present
- `POST /users/{user_id}/terminate` is present

Then stop the server (Ctrl+C).

### Step 5: Commit

```bash
git add task-management-backend/app/schemas/user.py task-management-backend/app/routers/users.py
git commit -m "feat: add terminate endpoint and guard reactivation of terminated users"
```

---

## Task 3: Frontend — Types, API function, hook

**Files:**
- Modify: `task-management-frontend/src/types/user.ts`
- Modify: `task-management-frontend/src/api/users.ts`
- Modify: `task-management-frontend/src/hooks/useUsers.ts`

### Step 1: Add `terminated_at` to the `User` type

In `task-management-frontend/src/types/user.ts`, add `terminated_at` to the `User` interface:

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  job_title: string | null;
  is_active: boolean;
  terminated_at: string | null;
  created_at: string;
}
```

Leave `UserCreate` and `UserUpdate` unchanged.

### Step 2: Add `terminateUser` API function

In `task-management-frontend/src/api/users.ts`, add:

```typescript
export const terminateUser = async (id: string): Promise<User> => {
  const res = await apiClient.post<User>(`/users/${id}/terminate`);
  return res.data;
};
```

### Step 3: Add `useTerminateUser` hook

In `task-management-frontend/src/hooks/useUsers.ts`, add the import for `terminateUser` and the new hook:

```typescript
import { listUsers, createUser, updateUser, terminateUser } from "@/api/users";
```

Then add after `useUpdateUser`:

```typescript
export function useTerminateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => terminateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
```

### Step 4: Build to verify no TypeScript errors

```bash
cd task-management-frontend
npm run build
```

Expected: clean compile.

### Step 5: Commit

```bash
git add task-management-frontend/src/types/user.ts task-management-frontend/src/api/users.ts task-management-frontend/src/hooks/useUsers.ts
git commit -m "feat: add terminateUser API and useTerminateUser hook"
```

---

## Task 4: Frontend — Add "terminated" badge variant

**Files:**
- Modify: `task-management-frontend/src/components/ui/Badge.tsx`

### Step 1: Add the `terminated` variant

In `task-management-frontend/src/components/ui/Badge.tsx`, add `terminated` to both the `variants` and `dots` objects:

```typescript
const variants = {
  // ... existing entries ...
  terminated: "bg-red-500/10 text-red-400 border border-red-500/25",
};

const dots: Record<string, string> = {
  // ... existing entries ...
  terminated: "bg-red-400",
};
```

The `BadgeVariant` type is derived automatically from `keyof typeof variants`, so it will include `"terminated"` once added.

### Step 2: Build to verify

```bash
cd task-management-frontend
npm run build
```

Expected: clean compile.

### Step 3: Commit

```bash
git add task-management-frontend/src/components/ui/Badge.tsx
git commit -m "feat: add terminated badge variant"
```

---

## Task 5: Frontend — Rewrite `UsersPage` with Edit modal + Terminate flow

**Files:**
- Modify: `task-management-frontend/src/pages/UsersPage.tsx`

This is the largest task. Replace the entire file with the implementation below.

**Key behaviours:**
- Two modals controlled by state: `addOpen` (Add Employee) and `editUser` (Edit Employee, holds the `User` being edited or `null`)
- Terminate confirmation is inline per-row: `confirmTerminateId` state holds the user ID being confirmed, or `null`
- A terminated row renders at `opacity-50`; its avatar background shifts to a muted red; Actions cell is empty
- Deactivate/Activate button is hidden once terminated
- Terminate button only appears when `!u.is_active && !u.terminated_at`

### Step 1: Replace `UsersPage.tsx`

Replace the entire contents of `task-management-frontend/src/pages/UsersPage.tsx` with:

```tsx
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
        job_title: data.job_title || undefined,
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

  const { data: users = [], isLoading } = useUsers();
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
    terminateUser.mutate(id, { onSuccess: () => setConfirmTerminateId(null) });
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
            {users.length} team member{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          Add Employee
        </Button>
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
              {users.map((u, i) => {
                const isTerminated = !!u.terminated_at;
                return (
                  <tr
                    key={u.id}
                    className={`animate-fade-slide stagger-${Math.min(i + 1, 5)}`}
                    style={{ opacity: isTerminated ? 0.5 : 1 }}
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
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
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
                          {/* Terminate — only shown when inactive */}
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
```

### Step 2: Build to verify no TypeScript errors

```bash
cd task-management-frontend
npm run build
```

Expected: clean compile.

### Step 3: Commit

```bash
git add task-management-frontend/src/pages/UsersPage.tsx
git commit -m "feat: add edit profile modal and terminate flow to UsersPage"
```

---

## Task 6: Smoke test

Start both servers and verify end-to-end:

```bash
# Terminal 1 — backend
cd task-management-backend
PYTHONPATH=. .venv/Scripts/uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd task-management-frontend
npm run dev
```

Open `http://localhost:5173`, log in as admin, go to **Users** and verify:

1. **Edit** — click Edit on any user → modal opens pre-filled with name/job title/role; email shown read-only. Change job title, save → table updates.
2. **Deactivate** — click Deactivate on an active user → status changes to Inactive. Terminate button appears.
3. **Terminate (blocked)** — try clicking Terminate on an *active* user via the API directly (should not be possible via UI since button is hidden; this is just a sanity note).
4. **Terminate (confirm)** — click Terminate on an inactive user → "Confirm terminate? Yes / No" appears. Click Yes → row dims, status shows red Terminated badge, Actions column shows `—`.
5. **Re-activate blocked** — try clicking Activate on a terminated user (should not appear in UI; confirm it is gone).
6. **No regression** — Add Employee still works normally.
