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
