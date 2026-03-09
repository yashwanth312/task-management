# Design: Role-Pair Task Templates

**Date:** 2026-03-08
**Status:** Approved

---

## Problem

The existing template system keys templates on the **assignee's** `job_title` only. This does not model the actual org workflows where the same assignee role receives different templates depending on who is creating the task (e.g. HR assigning a timesheet to any employee vs. an ERP Consultant requesting a salary certificate from HR).

---

## Roles in the Organisation

| Job Title | Notes |
|-----------|-------|
| CEO | Top-level, delegates and requests reports |
| HR | People ops — compliance, payroll, travel |
| Client Manager | Client/vendor-facing |
| IT Admin | Systems and infrastructure |
| ERP Consultant | Implements and supports ERP systems |

---

## Approved Template Matrix

| Creator | Assignee | Templates |
|---------|----------|-----------|
| CEO | Client Manager | Contract Agreement Request |
| CEO | HR | Employee Onsite Preparation, Employee Performance Report, Salaries Paid Overview |
| HR | `*` (any) | Timesheet Submission, Performance Review Submission |
| ERP Consultant | HR | Salary Certificate Request, Leave Request, Payroll Query, Employment Verification Letter |
| Client Manager | ERP Consultant | Work Status Update |
| ERP Consultant | ERP Consultant | *(no templates — custom only)* |

`*` = wildcard, matches any job title.

---

## Architecture

### Data Model Change (`taskTemplates.ts`)

Replace the current single-dimension `job_title` key with a two-key structure:

```ts
interface TemplateCategory {
  creator_job_title: string;   // exact job_title or "*" for any
  assignee_job_title: string;  // exact job_title or "*" for any
  templates: TaskTemplate[];
}
```

**Lookup function** (`getTemplatesForPair`):
- Accepts `creatorJobTitle: string | null` and `assigneeJobTitle: string | null`
- Returns all templates from categories where both keys match (exact or `*`)
- Returns `[]` if either argument is null/empty

### Frontend Change (`TaskForm.tsx`)

- Import `useAuth()` to access the current user's `job_title` (already available on the user object — returned by `/users/me`)
- Replace the current `getTemplatesForJobTitle(assignee.job_title)` call with `getTemplatesForPair(currentUser.job_title, assignee.job_title)`
- All other template UI behaviour remains unchanged (radio picker, auto-fill title/description, hidden in edit mode)

### No Backend Changes Required

Templates are purely frontend config. No schema, API, or migration changes needed.

---

## Files to Change

| File | Change |
|------|--------|
| `src/config/taskTemplates.ts` | New data structure, full template content, new lookup function |
| `src/components/tasks/TaskForm.tsx` | Read `currentUser.job_title`, call `getTemplatesForPair` |

---

## Out of Scope

- IT Admin template lanes (deferred)
- CEO → ERP Consultant lane (deferred)
- ERP Consultant → ERP Consultant templates (deferred, custom tasks only)
- Any backend changes
