# Design: Creator-Role Task Templates

**Date:** 2026-03-04
**Status:** Approved

## Goal

Make task creation faster by showing templates based on the *creator's* own organizational role (`job_title`), rather than the assignee's role. All authenticated users can create and assign tasks.

## Decisions

| Question | Decision |
|----------|----------|
| Who can create tasks? | All authenticated users (already the case) |
| Who can tasks be assigned to? | Anyone on the team (individual) or a group (admin only) |
| Whose `job_title` drives templates? | The logged-in creator's `job_title` |
| Template required? | Optional — "Custom (blank)" always available |
| Admins see templates? | Yes, based on their own `job_title` |

## What Changes

### `TaskForm` component
- Add prop: `creatorJobTitle?: string | null`
- Remove: template lookup from `selectedEmployee?.job_title`
- Add: template lookup from `creatorJobTitle`
- Template picker moves to top of form, shown unconditionally (when templates exist for the creator's role)
- Remove: the `assignMode === "individual" && templates.length > 0` guard on template picker

### `CreateTaskPage`
- Pass `user?.job_title ?? null` as `creatorJobTitle` prop to `TaskForm`
- No other changes

### `taskTemplates.ts`
- No changes

### Backend
- No changes

## Form Field Order (Create Mode)

1. Template picker — chips, "Custom (blank)" always first; hidden if creator has no matching templates
2. Assignment toggle — Individual / Group
3. Assignee select (individual) or Group select (group)
4. Title — pre-filled when template selected
5. Description — pre-filled when template selected
6. Due date chips — Today / Tomorrow / This Week / This Month / Custom
7. Priority — auto-set badge or manual select

## Out of Scope

- Adding new templates or template categories
- Making templates editable via the UI
- Backend storage of templates (they remain static in `taskTemplates.ts`)
- Changing group assignment availability (remains admin-only)
