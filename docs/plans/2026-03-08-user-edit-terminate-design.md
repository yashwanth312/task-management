# User Edit & Termination — Design

**Date:** 2026-03-08
**Status:** Approved

## Problem

Admins currently can only deactivate/reactivate users. They cannot edit profile fields (name, job title, role) from the UI, and there is no formal termination flow. Termination must be distinct from deactivation — it is irreversible and should only be permitted after a user is deactivated.

## Decisions

| Question | Decision |
|----------|----------|
| Termination storage | Soft delete — `terminated_at TIMESTAMPTZ NULL` column on `users` |
| Editable fields | Full Name, Job Title, Role only — email is read-only |
| UI pattern | Edit modal + in-row lifecycle buttons (Approach A) |

---

## Backend Design

### Migration
New Alembic migration: add `terminated_at TIMESTAMPTZ NULL DEFAULT NULL` to the `users` table.

### Schema changes (`app/schemas/user.py`)
- `UserResponse` gains `terminated_at: datetime | None`
- `UserUpdate` unchanged (termination has its own endpoint)

### New endpoint: `POST /users/{user_id}/terminate` (admin only)
1. Fetch user by ID; 404 if not found
2. 422 if `user.is_active is True` → `"Deactivate the user before terminating"`
3. 422 if `user.terminated_at is not None` → `"User is already terminated"`
4. Set `user.terminated_at = datetime.now(UTC)`, commit

### Guard on `PATCH /users/{user_id}`
If target user has `terminated_at` set and the patch includes `is_active: True`, raise 422: `"Terminated users cannot be reactivated"`.

---

## Frontend Design

### Types (`src/types/user.ts`)
Add `terminated_at: string | null` to the `User` interface.

### API (`src/api/users.ts`)
Add `terminateUser(id: string)` — calls `POST /users/{id}/terminate`.

### Hook (`src/hooks/useUsers.ts`)
Add `useTerminateUser()` mutation; on success invalidate `["users"]`.

### UsersPage — Actions column logic

| User state | Buttons shown |
|---|---|
| Active, not terminated | Edit · Deactivate |
| Inactive, not terminated | Edit · Activate · Terminate (red) |
| Terminated | *(no actions)* |

### Edit Employee modal
Reuses existing `Modal` component. Fields:
- Full Name (text input, pre-filled)
- Job Title (text input, pre-filled)
- Role (select: admin / employee, pre-filled)

Calls `PATCH /users/{id}` with changed fields only.

### Terminate confirmation
Inline — the Terminate button is replaced by "Confirm terminate? Yes / No" text in the same cell. No separate modal.

### Status column
Three states:
- **Active** — green dot + "Active"
- **Inactive** — muted dot + "Inactive"
- **Terminated** — no dot + red "Terminated" badge

### Terminated row treatment
Entire row renders at `opacity-50`. Avatar background shifts to muted red. No layout change.

---

## Out of Scope
- Email editing
- Re-activating terminated users (blocked at both API and UI layer)
- Bulk termination
- Audit log / termination notes
