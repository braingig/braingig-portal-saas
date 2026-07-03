export type EmployeeRecord = {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  job_title: string | null;
  hire_date: string | null;
  salary_cents: number | null;
  salary_type: "fixed" | "hourly" | null;
  phone: string | null;
  skills: string | null;
  status: string;
  user_id: string | null;
};

export type EmployeeWorkspaceStatus = "active" | "pending" | "not_invited";

export type PendingInvite = {
  email: string;
  token: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmployeeWorkspaceStatus(
  employee: EmployeeRecord,
  memberUserIds: Set<string>,
  pendingByEmail: Map<string, PendingInvite>,
  acceptedEmails: Set<string>,
): EmployeeWorkspaceStatus {
  const email = normalizeEmail(employee.email);

  if (employee.user_id && memberUserIds.has(employee.user_id)) {
    return "active";
  }

  // Joined via invite — even if user_id was not synced on the HR row yet
  if (acceptedEmails.has(email)) {
    return "active";
  }

  if (pendingByEmail.has(email)) {
    return "pending";
  }

  return "not_invited";
}

export const WORKSPACE_STATUS_LABEL: Record<EmployeeWorkspaceStatus, string> = {
  active: "Active",
  pending: "Invite pending",
  not_invited: "Not invited",
};

export const WORKSPACE_STATUS_CLASS: Record<EmployeeWorkspaceStatus, string> = {
  active: "border-success/30 bg-success/10 text-success",
  pending: "border-warning/30 bg-warning/10 text-warning",
  not_invited: "border-border bg-surface-2 text-muted-foreground",
};
