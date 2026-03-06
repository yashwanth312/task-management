# Design: My Tasks Page + Employee Task Creation

**Date:** 2026-03-06

## Problem

1. Employees have no "New Task" button — they cannot create tasks from the UI even though the backend allows it.
2. Employees have no dashboard view. The existing `/dashboard` is admin-only (company-wide stats). Employees need a personal overview of their task progress.

## Solution

### 1. Rename Tasks → My Tasks

The existing `/tasks` page (URL unchanged) is renamed to **My Tasks** in the sidebar and page header. A personal stats strip is added above the task list.

### 2. Personal Stats Strip

Derived **client-side** from the tasks already fetched by `GET /tasks` (no new backend endpoint). The strip shows:

- Four colored stat chips: Pending (amber), In Progress (teal), Completed (emerald), Overdue (red)
- A full-width completion progress bar: `X of Y tasks completed (Z%)`

Overdue = due_date < today AND status != "completed", computed on the frontend.

### 3. Employee Task Creation

- "New Task" button shown for **all** authenticated users (remove `user?.role === "admin"` guard in `TasksPage`)
- In `CreateTaskPage`, group assignment is hidden for non-admin users by passing an empty `groups` array
- Employee selector shows all active employees (any employee can assign to anyone)
- No backend changes needed

### 4. Admin Dashboard Unchanged

The existing `/dashboard` route and `DashboardPage` are untouched.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/TasksPage.tsx` | Add stats strip; show "New Task" for all users; rename labels |
| `src/components/layout/Sidebar.tsx` | "Tasks" → "My Tasks" nav label |
| `src/pages/CreateTaskPage.tsx` | Pass empty `groups` for non-admin users |

## Non-Goals

- No new backend endpoints
- No changes to admin Dashboard
- No route URL change (`/tasks` stays as-is)
