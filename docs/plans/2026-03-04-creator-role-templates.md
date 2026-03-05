# Creator-Role Task Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show task creation templates based on the logged-in creator's `job_title`, not the assignee's, so all users instantly see relevant templates when opening the Create Task form.

**Architecture:** Two-file frontend change only. `TaskForm` gets a new `creatorJobTitle` prop that replaces the existing `selectedEmployee?.job_title` lookup for templates. `CreateTaskPage` reads `user.job_title` from `AuthContext` and passes it down. No backend changes.

**Tech Stack:** React 18, TypeScript, React Hook Form, Zod, TanStack Query, `src/config/taskTemplates.ts` (static data)

---

### Task 1: Update `TaskForm` — switch template source to `creatorJobTitle`

**Files:**
- Modify: `task-management-frontend/src/components/tasks/TaskForm.tsx`

**Context:** The current template logic is at lines 103–120. Templates are derived from `selectedEmployee?.job_title`. The template picker (lines 176–216) is gated behind `assignMode === "individual" && templates.length > 0`. Both of these need to change.

**Step 1: Add `creatorJobTitle` to the props interface**

Find the `TaskFormProps` interface (line 29) and add the new prop:

```ts
interface TaskFormProps {
  defaultValues?: Partial<Task>;
  employees: User[];
  groups?: Group[];
  editMode?: boolean;
  creatorJobTitle?: string | null;   // <-- add this
  onSubmit: (data: TaskFormValues) => Promise<void>;
  submitLabel?: string;
}
```

**Step 2: Destructure `creatorJobTitle` in the function signature**

Find line 57 (`export function TaskForm({`) and add `creatorJobTitle = null` to the destructured props, alongside `editMode = false`.

```ts
export function TaskForm({
  defaultValues,
  employees,
  groups = [],
  editMode = false,
  creatorJobTitle = null,   // <-- add this
  onSubmit,
  submitLabel = "Save",
}: TaskFormProps) {
```

**Step 3: Replace the template lookup**

Find lines 103–110:
```ts
  // Find selected employee for template lookup
  const selectedEmployee = employees.find((e) => e.id === assignedTo) ?? null;
  const templates = getTemplatesForJobTitle(selectedEmployee?.job_title ?? null);

  // Reset template when assignee changes
  useEffect(() => {
    setValue("template_id", "custom");
  }, [assignedTo, setValue]);
```

Replace with:
```ts
  // Templates are based on the creator's own job_title
  const templates = getTemplatesForJobTitle(creatorJobTitle);
```

> Note: Remove the `selectedEmployee` line and the `useEffect` that reset `template_id` on `assignedTo` change — that reset was needed because assignee drove the template list; now it doesn't.

**Step 4: Move the template picker above the assignment toggle**

Currently the template picker JSX is at lines 176–216, placed after the assignment toggle. Move the entire template picker block (`{/* Template picker ... */}`) so it sits **before** the assignment toggle block (`{/* Assignment mode toggle ... */}`).

Also update the render condition from:
```tsx
{!editMode && assignMode === "individual" && templates.length > 0 && (
```
to:
```tsx
{!editMode && templates.length > 0 && (
```

The `assignMode === "individual"` guard is no longer needed — templates are based on the creator, not the assignee.

**Step 5: Verify the `watch("assigned_to")` reference is still present**

`assignedTo` is still used in line 88 (`const assignedTo = watch("assigned_to")`) and later in the individual assignee select. Confirm it's still there — you only removed the `selectedEmployee` derivation and the reset `useEffect`, not the `assignedTo` watch itself.

**Step 6: Manual smoke test**
- Start frontend: `cd task-management-frontend && npm run dev`
- Log in as a user whose account has a `job_title` set (e.g. "Software Engineer")
- Navigate to `/tasks/new`
- Confirm template chips appear immediately at the top, before the assignment section
- Select a template — confirm title + description pre-fill
- Switch to a different assignee — confirm template is NOT reset (no longer tied to assignee)
- Select "Custom (blank)" — confirm title/description are NOT pre-filled
- Log in as a user with no `job_title` — confirm no template section appears

**Step 7: Commit**
```bash
cd task-management-frontend
git add src/components/tasks/TaskForm.tsx
git commit -m "feat: show templates from creator job_title instead of assignee"
```

---

### Task 2: Update `CreateTaskPage` — pass `creatorJobTitle` to `TaskForm`

**Files:**
- Modify: `task-management-frontend/src/pages/CreateTaskPage.tsx`

**Context:** `CreateTaskPage` already imports `useAuth` and reads `user` from it (line 11: `const { user } = useAuth()`). It just needs to pass `user?.job_title` down to `TaskForm`.

**Step 1: Pass `creatorJobTitle` to `TaskForm`**

Find the `<TaskForm>` usage (around line 65) and add the prop:

```tsx
<TaskForm
  employees={employees}
  groups={groups}
  creatorJobTitle={user?.job_title ?? null}   // <-- add this line
  onSubmit={handleSubmit}
  submitLabel="Create Task →"
/>
```

**Step 2: TypeScript build check**
```bash
cd task-management-frontend
npm run build
```
Expected: no TypeScript errors.

**Step 3: End-to-end manual test**
- Log in as admin with `job_title = "Management"`
- Go to `/tasks/new` — confirm Management templates appear (Performance Review, Meeting Prep, Project Plan)
- Log in as an employee with `job_title = "Software Engineer"`
- Go to `/tasks/new` — confirm SE templates appear (Bug Fix, Feature Implementation, Code Review, Refactoring)
- Assign the task to someone with a different `job_title` — confirm templates do NOT change
- Log in as a user with no `job_title` — confirm no template section

**Step 4: Commit**
```bash
git add src/pages/CreateTaskPage.tsx
git commit -m "feat: pass creator job_title to TaskForm for role-based templates"
```

---

## Done

Both commits together deliver the feature:
- Templates shown immediately on form load, driven by the logged-in user's role
- Assignee selection fully decoupled from template visibility
- No backend changes, no new files, no new dependencies
