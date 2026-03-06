# My Tasks Page + Employee Task Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the Tasks page to "My Tasks", add a personal stats strip with a completion progress bar, and give employees the ability to create tasks.

**Architecture:** All changes are frontend-only. Stats are computed client-side from the tasks array already returned by `GET /tasks` (which is already scoped to the logged-in user for employees). No new backend endpoints or routes needed.

**Tech Stack:** React 18, TypeScript, TanStack Query v5, Tailwind CSS, CSS variables (design system in `index.css`)

---

### Task 1: Show "New Task" button for all users + rename page

**Files:**
- Modify: `task-management-frontend/src/pages/TasksPage.tsx`

The current button is behind `user?.role === "admin"`. Remove that guard. Also update the page title from "Tasks" to "My Tasks" and the subtitle copy.

**Step 1: Open the file and locate the guard**

File: [task-management-frontend/src/pages/TasksPage.tsx](task-management-frontend/src/pages/TasksPage.tsx)

The button is at line 58:
```tsx
{user?.role === "admin" && (
  <Link to="/tasks/new">
```

**Step 2: Add stats computation after the `useTasks` call**

After line 35 (the `useTasks` call), insert this block:

```tsx
const today = new Date().toISOString().split("T")[0];

const stats = tasks
  ? {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue: tasks.filter(
        (t) => t.due_date && t.due_date < today && t.status !== "completed"
      ).length,
    }
  : null;

const completionPct =
  stats && stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;
```

Note: `t.due_date` on the frontend is a string like `"2026-03-05"`. Comparing it to `today` (also `"YYYY-MM-DD"`) works correctly via lexicographic string comparison.

**Step 3: Update the page header**

Replace the `<h1>` text from `"Tasks"` to `"My Tasks"`.

Replace the subtitle paragraph:
```tsx
<p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
  {tasks
    ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""} ${status || priority ? "matching filters" : "total"}`
    : "Loading…"}
</p>
```
with:
```tsx
<p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
  {tasks
    ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""} ${status || priority ? "matching filters" : "assigned to you"}`
    : "Loading…"}
</p>
```

**Step 4: Remove the admin guard from the "New Task" button**

Change:
```tsx
{user?.role === "admin" && (
  <Link to="/tasks/new">
    <Button size="sm">...</Button>
  </Link>
)}
```
to:
```tsx
<Link to="/tasks/new">
  <Button size="sm">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 1v10M1 6h10" strokeLinecap="round" />
    </svg>
    New Task
  </Button>
</Link>
```

**Step 5: Add the stats strip between the page header and the filters panel**

Insert this block after the closing `</div>` of the page header section and before the filters `<div>`:

```tsx
{/* Stats strip */}
{stats && stats.total > 0 && (
  <div
    className="rounded-sm p-4 space-y-3 animate-fade-slide"
    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
  >
    {/* Stat chips */}
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Pending", value: stats.pending, color: "#f59e0b" },
        { label: "In Progress", value: stats.in_progress, color: "#14b8a6" },
        { label: "Completed", value: stats.completed, color: "#10b981" },
        { label: "Overdue", value: stats.overdue, color: "#ef4444" },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
          <span className="text-xs font-mono font-semibold" style={{ color }}>
            {value}
          </span>
        </div>
      ))}
    </div>

    {/* Completion progress bar */}
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Completion
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          {stats.completed} of {stats.total} tasks · {completionPct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--surface-3)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${completionPct}%`, background: "#10b981" }}
        />
      </div>
    </div>
  </div>
)}
```

**Step 6: Verify the page renders correctly**

Run the frontend dev server:
```bash
cd task-management-frontend
npm run dev
```

Log in as an employee. Verify:
- Page title shows "My Tasks"
- "New Task" button is visible
- Stats strip appears with 4 chips and a progress bar
- Overdue count is correct (tasks with past due dates that aren't completed)

Log in as admin. Verify:
- Same stats strip appears (scoped to admin's own tasks — admins see all tasks so numbers will differ)
- "New Task" button still works

**Step 7: Commit**

```bash
git add task-management-frontend/src/pages/TasksPage.tsx
git commit -m "feat: rename Tasks to My Tasks, add personal stats strip, show New Task for all users"
```

---

### Task 2: Update sidebar nav label

**Files:**
- Modify: `task-management-frontend/src/components/layout/Sidebar.tsx`

**Step 1: Change the label**

In [task-management-frontend/src/components/layout/Sidebar.tsx](task-management-frontend/src/components/layout/Sidebar.tsx), find the first nav item in the `navItems` array (around line 5):

```tsx
{
  to: "/tasks",
  label: "Tasks",
  adminOnly: false,
  ...
}
```

Change `label: "Tasks"` to `label: "My Tasks"`.

**Step 2: Verify**

In the browser, confirm the sidebar now shows "My Tasks" instead of "Tasks" for both roles.

**Step 3: Commit**

```bash
git add task-management-frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: rename Tasks nav item to My Tasks in sidebar"
```

---

### Task 3: Hide group assignment for non-admin users in CreateTaskPage

**Files:**
- Modify: `task-management-frontend/src/pages/CreateTaskPage.tsx`

**Step 1: Locate the groups prop**

In [task-management-frontend/src/pages/CreateTaskPage.tsx](task-management-frontend/src/pages/CreateTaskPage.tsx), line 13:

```tsx
const { data: groups = [] } = useGroups(user?.role === "admin");
```

This already conditionally fetches groups (only for admin). But the `groups` array is passed directly to `TaskForm`. `TaskForm` shows the Individual/Group toggle when `groups.length > 0`. Since `useGroups(false)` returns an empty array, group assignment is already hidden for employees.

**Step 2: Verify the description copy is appropriate for employees**

The subtitle reads "Create and assign a new task to your team." — this is fine for both roles. No change needed.

**Step 3: Run TypeScript check**

```bash
cd task-management-frontend
npm run build
```

Expected: no TypeScript errors.

**Step 4: Manual test — employee creates a task**

Log in as an employee. Go to My Tasks → click "New Task":
- Verify no group assignment toggle appears
- Verify employee dropdown shows all active employees
- Verify you can select yourself or another employee
- Submit and verify task appears in the list

**Step 5: Commit (if any changes were needed)**

If no code changes were required (the `useGroups(user?.role === "admin")` already handles it), skip this commit. Otherwise:

```bash
git add task-management-frontend/src/pages/CreateTaskPage.tsx
git commit -m "fix: ensure group assignment hidden for non-admin users in CreateTaskPage"
```

---

### Task 4: Final verification

**Step 1: Full employee flow**

1. Log in as `yash@kvbits.com` (employee)
2. Confirm sidebar shows "My Tasks"
3. Confirm stats strip shows personal task counts
4. Confirm "New Task" button is visible
5. Create a task assigned to yourself → verify it appears in the list and stats update
6. Create a task assigned to another employee → verify it appears in creator's list (as `created_by`) — wait, actually `GET /tasks` for employees filters by `assigned_to == user.id`, so if you assign to someone else you won't see it in your own list. This is expected behavior.
7. Confirm `/dashboard` (admin-only) still redirects employees away

**Step 2: Full admin flow**

1. Log in as admin
2. Confirm "My Tasks" label in sidebar
3. Confirm stats strip shows (admin sees all tasks, stats reflect all tasks)
4. Confirm admin can still access `/dashboard` for company-wide view
5. Confirm "New Task" still works with group assignment

**Step 3: Commit if any final tweaks**

```bash
git add -p
git commit -m "fix: <describe any final tweaks>"
```
