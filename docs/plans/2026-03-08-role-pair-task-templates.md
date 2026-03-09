# Role-Pair Task Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-dimension (creator job_title only) template lookup with a two-dimension (creator × assignee job_title) lookup, and add org-specific templates for all approved workflow lanes.

**Architecture:** `taskTemplates.ts` gains a new data structure keyed by `creator_job_title` + `assignee_job_title` (either can be `"*"` for wildcard). A new `getTemplatesForPair` function replaces `getTemplatesForJobTitle`. `TaskForm.tsx` watches the selected assignee and passes both creator and assignee job titles to the lookup.

**Tech Stack:** TypeScript, React 18, React Hook Form (`watch`), `useMemo`

---

## Context You Need

### How templates work today

- **`src/config/taskTemplates.ts`** — static config. Currently: `TASK_TEMPLATES: Array<{ job_title: string, templates: TaskTemplate[] }>`. Lookup: `getTemplatesForJobTitle(creatorJobTitle)`.
- **`src/components/tasks/TaskForm.tsx`** — receives `creatorJobTitle` prop (string | null). Calls `getTemplatesForJobTitle(creatorJobTitle)` in a `useMemo`. Shows template radio buttons above the assignment section.
- **`src/pages/CreateTaskPage.tsx`** — already passes `creatorJobTitle={user?.job_title ?? null}` to `TaskForm`.

### What changes

Templates must now also depend on **who is being assigned to**. The lookup becomes `getTemplatesForPair(creatorJobTitle, assigneeJobTitle)`. `TaskForm` needs to watch the `assigned_to` field, find the matching employee object, extract their `job_title`, and pass it to the new function.

### Approved template matrix

| creator_job_title | assignee_job_title | Templates |
|-------------------|--------------------|-----------|
| `"CEO"` | `"Client Manager"` | Contract Agreement Request |
| `"CEO"` | `"HR"` | Employee Onsite Preparation, Employee Performance Report, Salaries Paid Overview |
| `"HR"` | `"*"` | Timesheet Submission, Performance Review Submission |
| `"ERP Consultant"` | `"HR"` | Salary Certificate Request, Leave Request, Payroll Query, Employment Verification Letter |
| `"Client Manager"` | `"ERP Consultant"` | Work Status Update |

---

## Task 1: Rewrite `taskTemplates.ts`

**File:** `src/config/taskTemplates.ts`

Replace the entire file. The new structure:

```ts
export interface TaskTemplate {
  id: string;
  label: string;
  title: string;
  description: string;
}

export interface TemplateCategory {
  creator_job_title: string; // exact job title or "*" for any creator
  assignee_job_title: string; // exact job title or "*" for any assignee
  templates: TaskTemplate[];
}

export const TASK_TEMPLATES: TemplateCategory[] = [
  {
    creator_job_title: "CEO",
    assignee_job_title: "Client Manager",
    templates: [
      {
        id: "ceo-cm-contract",
        label: "Contract Agreement Request",
        title: "Contract agreement required: [client or vendor name]",
        description:
          "Please prepare and submit the contract agreement for the party listed above.\n\nSteps:\n1. Draft the agreement using the standard template\n2. Include scope of work, payment terms, and SLA clauses\n3. Share with the relevant party for review\n4. Obtain signatures and file the executed copy",
      },
    ],
  },
  {
    creator_job_title: "CEO",
    assignee_job_title: "HR",
    templates: [
      {
        id: "ceo-hr-onsite",
        label: "Employee Onsite Preparation",
        title: "Onsite preparation for: [employee name] — [destination, dates]",
        description:
          "Please arrange all logistics for the employee's onsite visit.\n\nRequired:\n1. Flight bookings (economy unless pre-approved otherwise)\n2. Hotel accommodation for the full duration\n3. Local transport or cab arrangements if needed\n4. Share itinerary with the employee at least 48 hours before travel\n5. Confirm all bookings and attach receipts to this task",
      },
      {
        id: "ceo-hr-perf-report",
        label: "Employee Performance Report",
        title: "Performance report requested: [employee name or 'all staff'] — [period]",
        description:
          "Please compile and share the performance report for the specified period.\n\nInclude:\n1. KPI/OKR achievement summary\n2. Attendance and punctuality record\n3. Peer and manager feedback highlights\n4. Any disciplinary or commendation notes\n5. Overall rating and recommended actions",
      },
      {
        id: "ceo-hr-salary-overview",
        label: "Salaries Paid Overview",
        title: "Salaries paid overview: [month/quarter/year]",
        description:
          "Please prepare a payroll summary for the specified period.\n\nInclude:\n1. Total gross payroll amount\n2. Breakdown by department or role\n3. Net salaries paid after deductions\n4. Any bonuses, increments, or one-off payments\n5. Share as a PDF or spreadsheet",
      },
    ],
  },
  {
    creator_job_title: "HR",
    assignee_job_title: "*",
    templates: [
      {
        id: "hr-any-timesheet",
        label: "Timesheet Submission",
        title: "Submit timesheet for: [period, e.g. Week ending DD/MM/YYYY]",
        description:
          "Please complete and submit your timesheet for the period above.\n\nSteps:\n1. Log all hours worked per project/task for each day\n2. Verify total hours match your contracted hours\n3. Add notes for any overtime, leave, or absences\n4. Submit via the timesheet system by end of day Friday\n\nContact HR if you have any queries.",
      },
      {
        id: "hr-any-perf-review",
        label: "Performance Review Submission",
        title: "Complete your performance self-review: [review cycle, e.g. Q1 2026]",
        description:
          "Please complete your self-review for the cycle above and submit it before the deadline.\n\nCover the following:\n1. Key achievements and delivered outcomes\n2. Areas for improvement and development goals\n3. Feedback on team collaboration\n4. Goals you want to set for the next cycle\n\nSubmit your completed review via the HR portal or reply to this task with the document attached.",
      },
    ],
  },
  {
    creator_job_title: "ERP Consultant",
    assignee_job_title: "HR",
    templates: [
      {
        id: "erp-hr-salary-cert",
        label: "Salary Certificate Request",
        title: "Salary certificate request — [your name]",
        description:
          "Requesting an official salary certificate for the purpose of: [state purpose, e.g. visa application / bank loan / rental agreement].\n\nPlease include:\n1. Employee name, designation, and department\n2. Monthly/annual gross salary\n3. Employment start date\n4. Company letterhead and authorised signature\n\nRequired by: [date]",
      },
      {
        id: "erp-hr-leave",
        label: "Leave Request",
        title: "Leave request: [your name] — [date range]",
        description:
          "Requesting approval for leave as detailed below.\n\nLeave type: [Annual / Sick / Personal / Other]\nFrom: [start date]\nTo: [end date]\nTotal days: [N]\nReason: [brief reason]\n\nCoverage arrangement: [who will cover or N/A]\n\nPlease confirm approval or contact me if any issues.",
      },
      {
        id: "erp-hr-payroll-query",
        label: "Payroll Query",
        title: "Payroll query: [your name] — [month/year]",
        description:
          "I have a query regarding my payslip for the period above.\n\nIssue description:\n[Describe the discrepancy or question clearly — e.g. incorrect deduction, missing reimbursement, overtime not reflected]\n\nPlease review and confirm the correction or provide an explanation at your earliest convenience.",
      },
      {
        id: "erp-hr-emp-verification",
        label: "Employment Verification Letter",
        title: "Employment verification letter — [your name]",
        description:
          "Requesting an employment verification letter for the purpose of: [state purpose].\n\nPlease include:\n1. Full name and designation\n2. Employment status (full-time / part-time / contract)\n3. Start date (and end date if applicable)\n4. Confirmation of salary if required\n5. Company letterhead and authorised signature\n\nRequired by: [date]",
      },
    ],
  },
  {
    creator_job_title: "Client Manager",
    assignee_job_title: "ERP Consultant",
    templates: [
      {
        id: "cm-erp-status-update",
        label: "Work Status Update",
        title: "Work status update requested: [project or sprint name] — [date]",
        description:
          "Please provide a status update for the period/sprint above.\n\nInclude:\n1. Tickets closed (list ticket IDs and brief descriptions)\n2. Tickets currently open/in progress\n3. Any blockers or issues impacting delivery\n4. Overall progress summary (1–2 sentences)\n5. Expected completion for any overdue items\n\nShare the update as a comment on this task or attach a report.",
      },
    ],
  },
];

export function getTemplatesForPair(
  creatorJobTitle: string | null,
  assigneeJobTitle: string | null
): TaskTemplate[] {
  if (!creatorJobTitle) return [];
  return TASK_TEMPLATES.filter(
    (cat) =>
      (cat.creator_job_title === creatorJobTitle || cat.creator_job_title === "*") &&
      (cat.assignee_job_title === assigneeJobTitle || cat.assignee_job_title === "*")
  ).flatMap((cat) => cat.templates);
}
```

**Step 1: Replace the file**

Open `src/config/taskTemplates.ts` and replace the entire contents with the code above.

**Step 2: Verify no TypeScript errors**

```bash
cd task-management-frontend
npm run build
```

Expected: compiles cleanly (ignore Vite output warnings unrelated to this file). If you see errors in `TaskForm.tsx` about `getTemplatesForJobTitle` not existing, that is expected — fix it in Task 2.

**Step 3: Commit**

```bash
git add task-management-frontend/src/config/taskTemplates.ts
git commit -m "feat: replace job-title templates with role-pair template matrix"
```

---

## Task 2: Update `TaskForm.tsx` to use the pair lookup

**File:** `src/components/tasks/TaskForm.tsx`

### What to change

**A. Update the import** (line 13) — replace `getTemplatesForJobTitle` with `getTemplatesForPair`:

```ts
// Before
import { getTemplatesForJobTitle } from "@/config/taskTemplates";

// After
import { getTemplatesForPair } from "@/config/taskTemplates";
```

**B. Watch the `assigned_to` field** — add to the existing `watch` calls (around line 88):

```ts
// Before
const duePreset = watch("due_preset");
const assignMode = watch("assign_mode");
const templateId = watch("template_id");

// After
const duePreset = watch("due_preset");
const assignMode = watch("assign_mode");
const templateId = watch("template_id");
const assignedTo = watch("assigned_to");
```

**C. Derive the assignee's job title** — add below the `watch` block:

```ts
const assigneeJobTitle = useMemo(
  () => employees.find((u) => u.id === assignedTo)?.job_title ?? null,
  [assignedTo, employees]
);
```

**D. Replace the template lookup** (line ~105):

```ts
// Before
const templates = useMemo(() => getTemplatesForJobTitle(creatorJobTitle), [creatorJobTitle]);

// After
const templates = useMemo(
  () => getTemplatesForPair(creatorJobTitle, assigneeJobTitle),
  [creatorJobTitle, assigneeJobTitle]
);
```

**E. Reset template when assignee changes** — add a new `useEffect` after the existing two:

```ts
useEffect(() => {
  setValue("template_id", "custom");
}, [assignedTo, setValue]);
```

### Step 1: Apply all five changes above to `TaskForm.tsx`

Edit the file as described. Do not change anything else.

### Step 2: Build to confirm no type errors

```bash
cd task-management-frontend
npm run build
```

Expected: clean compile. If `User.job_title` is not typed as `string | null | undefined` in `src/types/user.ts`, check that file and confirm it matches the DB schema (it should already have `job_title?: string | null`).

### Step 3: Manual smoke test

1. Start the dev server: `npm run dev`
2. Log in as a user with `job_title = "CEO"`
3. Click **New Task**
4. Select an assignee with `job_title = "Client Manager"` → expect **Contract Agreement Request** template to appear
5. Select an assignee with `job_title = "HR"` → expect 3 CEO→HR templates
6. Select an assignee with any other job title → expect no templates (blank form)
7. Switch assignee → confirm template resets to "Custom (blank)"
8. Log in as `job_title = "HR"`, assign to any employee → expect 2 HR→any templates
9. Log in as `job_title = "ERP Consultant"`, assign to HR → expect 4 ERP→HR templates
10. Log in as `job_title = "Client Manager"`, assign to ERP Consultant → expect Work Status Update

### Step 4: Commit

```bash
git add task-management-frontend/src/components/tasks/TaskForm.tsx
git commit -m "feat: look up templates by creator+assignee job title pair"
```

---

## Task 3: Verify user job titles are set in the database

Templates only appear if users have the exact `job_title` strings in the DB. The exact strings that must match (case-insensitive in the lookup but stored as-is):

| Role | Exact string required |
|------|----------------------|
| CEO | `CEO` |
| HR | `HR` |
| Client Manager | `Client Manager` |
| ERP Consultant | `ERP Consultant` |
| IT Admin | `IT Admin` |

### Step 1: Check existing users

Go to **Users** page in the app (admin login required) and confirm each employee has the correct `job_title` set. If not, edit via the PATCH `/users/{id}` endpoint or through the UI.

### Step 2: Update any missing job titles via the UI

In **Users** page → click the edit icon next to a user → update their Job Title field to match the exact strings above.

### Step 3: Re-run smoke test from Task 2 Step 3

Confirm templates appear as expected for each role pair.

---

## Done

When all three tasks are complete and smoke tests pass, the role-pair template system is live. No backend changes were required.
