export interface TaskTemplate {
  id: string;
  label: string;
  title: string;
  description: string;
}

export interface TemplateCategory {
  job_title: string;
  templates: TaskTemplate[];
}

export const TASK_TEMPLATES: TemplateCategory[] = [
  {
    job_title: "Software Engineer",
    templates: [
      {
        id: "se-bug",
        label: "Bug Fix",
        title: "Fix bug: [describe issue]",
        description: "Investigate and resolve the reported bug. Include root cause analysis and regression test.",
      },
      {
        id: "se-feature",
        label: "Feature Implementation",
        title: "Implement feature: [feature name]",
        description: "Design and implement the feature according to the spec. Include unit tests and documentation.",
      },
      {
        id: "se-review",
        label: "Code Review",
        title: "Review PR: [PR title or number]",
        description: "Review the pull request for correctness, style, and potential issues. Leave actionable feedback.",
      },
      {
        id: "se-refactor",
        label: "Refactoring",
        title: "Refactor: [component or module]",
        description: "Improve code structure, readability, and maintainability without changing external behavior.",
      },
    ],
  },
  {
    job_title: "Designer",
    templates: [
      {
        id: "des-wireframe",
        label: "Wireframes",
        title: "Wireframes for: [feature or page]",
        description: "Create low-fidelity wireframes showing layout, navigation, and key interactions.",
      },
      {
        id: "des-mockup",
        label: "UI Mockup",
        title: "High-fidelity mockup: [feature or page]",
        description: "Produce polished mockups with brand-correct colors, typography, and spacing.",
      },
      {
        id: "des-prototype",
        label: "Prototype",
        title: "Interactive prototype: [flow name]",
        description: "Build a clickable prototype demonstrating the end-to-end user flow for review.",
      },
    ],
  },
  {
    job_title: "Marketing",
    templates: [
      {
        id: "mkt-campaign",
        label: "Campaign Brief",
        title: "Campaign brief: [campaign name]",
        description: "Define campaign goals, target audience, channels, messaging, and KPIs.",
      },
      {
        id: "mkt-copy",
        label: "Copywriting",
        title: "Write copy for: [asset or channel]",
        description: "Draft compelling copy aligned with brand voice. Include CTA and SEO keywords if applicable.",
      },
      {
        id: "mkt-report",
        label: "Performance Report",
        title: "Marketing report: [period]",
        description: "Analyse campaign metrics, summarise insights, and provide recommendations for next period.",
      },
    ],
  },
  {
    job_title: "Operations",
    templates: [
      {
        id: "ops-process",
        label: "Process Documentation",
        title: "Document process: [process name]",
        description: "Write step-by-step documentation for the process, including roles, tools, and edge cases.",
      },
      {
        id: "ops-audit",
        label: "Audit",
        title: "Audit: [system or process]",
        description: "Review current state, identify gaps or inefficiencies, and recommend improvements.",
      },
      {
        id: "ops-vendor",
        label: "Vendor Evaluation",
        title: "Evaluate vendor: [vendor name]",
        description: "Assess vendor capabilities, pricing, SLAs, and fit. Provide a recommendation summary.",
      },
    ],
  },
  {
    job_title: "Management",
    templates: [
      {
        id: "mgmt-review",
        label: "Performance Review",
        title: "Performance review: [employee name]",
        description: "Complete quarterly/annual review — gather peer feedback, document achievements, and set goals.",
      },
      {
        id: "mgmt-meeting",
        label: "Meeting Prep",
        title: "Prepare for: [meeting name]",
        description: "Create agenda, gather supporting data, and distribute materials at least 24 hours before.",
      },
      {
        id: "mgmt-plan",
        label: "Project Plan",
        title: "Project plan: [project name]",
        description: "Define scope, milestones, resource requirements, risks, and success criteria.",
      },
    ],
  },
];

export function getTemplatesForJobTitle(jobTitle: string | null): TaskTemplate[] {
  if (!jobTitle) return [];
  const category = TASK_TEMPLATES.find(
    (c) => c.job_title.toLowerCase() === jobTitle.toLowerCase()
  );
  return category?.templates ?? [];
}
