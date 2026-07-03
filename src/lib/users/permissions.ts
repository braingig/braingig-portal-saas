import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type Permission =
  | "dashboard" | "projects" | "tasks" | "calendar" | "team" | "employees"
  | "attendance" | "leave" | "payroll" | "recruitment"
  | "crm" | "reports" | "docs" | "files" | "messages"
  | "settings" | "billing" | "organization"
  | "users" | "audit"
  | "my_tasks";

export const ROLE_PERMS: Record<AppRole, Permission[]> = {
  owner: [
    "dashboard", "projects", "tasks", "calendar", "team", "employees",
    "attendance", "leave", "payroll", "recruitment",
    "crm", "reports", "docs", "files", "messages",
    "settings", "billing", "organization", "users", "audit", "my_tasks",
  ],
  admin: [
    "dashboard", "projects", "tasks", "calendar", "team", "employees",
    "attendance", "leave", "payroll", "recruitment",
    "crm", "reports", "docs", "files", "messages",
    "settings", "billing", "organization", "users", "audit", "my_tasks",
  ],
  hr: [
    "dashboard", "employees", "attendance", "leave", "recruitment", "payroll",
    "calendar", "messages", "docs", "my_tasks",
  ],
  team_lead: [
    "dashboard", "projects", "tasks", "team", "calendar", "reports",
    "attendance", "leave", "messages", "docs", "files", "my_tasks",
  ],
  employee: [
    "dashboard", "my_tasks", "tasks", "projects", "calendar",
    "attendance", "leave", "messages", "docs", "files",
  ],
  member: [
    "dashboard", "my_tasks", "tasks", "projects", "calendar",
    "attendance", "leave", "messages", "docs", "files",
  ],
  client: [
    "dashboard", "projects", "files", "messages", "calendar",
  ],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  calendar: "Calendar",
  team: "Team",
  employees: "Employees",
  attendance: "Attendance",
  leave: "Leave",
  payroll: "Payroll",
  recruitment: "Recruitment",
  crm: "CRM",
  reports: "Reports",
  docs: "Docs",
  files: "Files",
  messages: "Messages",
  settings: "Settings",
  billing: "Billing",
  organization: "Organization",
  users: "User Management",
  audit: "Audit Log",
  my_tasks: "My Tasks",
};

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard",
  "my_tasks",
  "projects",
  "tasks",
  "calendar",
  "team",
  "employees",
  "attendance",
  "leave",
  "payroll",
  "recruitment",
  "crm",
  "reports",
  "docs",
  "files",
  "messages",
  "settings",
  "billing",
  "organization",
  "users",
  "audit",
];

export function permissionsForRole(role: AppRole): Permission[] {
  return ROLE_PERMS[role] ?? [];
}

export function resolveMemberPermissions(
  role: AppRole,
  customPermissions: Permission[] | null | undefined,
): Permission[] {
  if (customPermissions?.length) return customPermissions;
  return permissionsForRole(role);
}

export function hasCustomPermissions(customPermissions: Permission[] | null | undefined) {
  return Boolean(customPermissions?.length);
}

export function formatPermissionSummary(
  permissions: Permission[],
  maxVisible = 2,
): { visible: string[]; overflow: number; full: string } {
  const labels = permissions.map((p) => PERMISSION_LABELS[p] ?? p);
  const visible = labels.slice(0, maxVisible);
  const overflow = Math.max(0, labels.length - maxVisible);
  return { visible, overflow, full: labels.join(", ") };
}

export const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  team_lead: "Team Lead",
  employee: "Employee",
  member: "Member",
  client: "Client",
};
