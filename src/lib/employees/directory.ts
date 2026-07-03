import { supabase } from "@/integrations/supabase/client";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import type { EmployeeRecord } from "@/lib/employees/workspace-status";
import { normalizeEmail } from "@/lib/employees/workspace-status";

const EXTENDED_SELECT =
  "id, full_name, email, department, job_title, hire_date, salary_cents, salary_type, phone, skills, status, user_id";
const BASE_SELECT =
  "id, full_name, email, department, job_title, hire_date, salary_cents, status, user_id";

type WorkspaceMember = {
  user_id: string;
  joined_at: string;
  full_name: string | null;
  job_title: string | null;
};

function mapEmployeeRow(row: Record<string, unknown>): EmployeeRecord {
  return {
    ...row,
    salary_type: "salary_type" in row ? (row.salary_type as EmployeeRecord["salary_type"]) : null,
    phone: "phone" in row ? (row.phone as string | null) : null,
    skills: "skills" in row ? (row.skills as string | null) : null,
  } as EmployeeRecord;
}

function employeeRichness(employee: EmployeeRecord) {
  let score = 0;
  if (employee.department) score += 1;
  if (employee.salary_cents != null) score += 1;
  if (employee.hire_date) score += 1;
  if (employee.phone) score += 1;
  if (employee.skills) score += 1;
  if (employee.job_title) score += 1;
  if (employee.user_id) score += 2;
  return score;
}

/** Collapse duplicate HR rows for the same person (manual + auto-synced). */
export function dedupeEmployeeRows(rows: EmployeeRecord[]): EmployeeRecord[] {
  const kept: EmployeeRecord[] = [];

  for (const row of rows) {
    const emailKey = normalizeEmail(row.email);
    const matchIndex = kept.findIndex((existing) => {
      if (row.user_id && existing.user_id && row.user_id === existing.user_id) return true;
      if (emailKey && normalizeEmail(existing.email) === emailKey) return true;
      return false;
    });

    if (matchIndex === -1) {
      kept.push(row);
      continue;
    }

    const existing = kept[matchIndex];
    const winner = employeeRichness(row) > employeeRichness(existing) ? row : existing;
    const merged: EmployeeRecord = {
      ...winner,
      user_id: winner.user_id ?? row.user_id ?? existing.user_id,
      department: winner.department ?? existing.department,
      job_title: winner.job_title ?? existing.job_title,
      hire_date: winner.hire_date ?? existing.hire_date,
      salary_cents: winner.salary_cents ?? existing.salary_cents,
      salary_type: winner.salary_type ?? existing.salary_type,
      phone: winner.phone ?? existing.phone,
      skills: winner.skills ?? existing.skills,
    };
    kept[matchIndex] = merged;
  }

  return kept.sort((a, b) => a.full_name.localeCompare(b.full_name));
}

async function fetchEmployeeRows(orgId: string): Promise<EmployeeRecord[]> {
  let res = await supabase
    .from("employees")
    .select(EXTENDED_SELECT)
    .eq("organization_id", orgId)
    .order("full_name");

  if (res.error && isMissingColumnError(res.error)) {
    res = await supabase
      .from("employees")
      .select(BASE_SELECT)
      .eq("organization_id", orgId)
      .order("full_name");
  }

  if (res.error) throw res.error;
  return (res.data ?? []).map((row) => mapEmployeeRow(row as Record<string, unknown>));
}

async function fetchWorkspaceMembers(orgId: string): Promise<WorkspaceMember[]> {
  const { data: memberRows, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id, joined_at")
    .eq("organization_id", orgId);

  if (membersError) throw membersError;

  const ids = (memberRows ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, job_title")
    .in("id", ids);

  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (memberRows ?? []).map((m) => ({
    user_id: m.user_id,
    joined_at: m.joined_at,
    full_name: profileMap.get(m.user_id)?.full_name ?? null,
    job_title: profileMap.get(m.user_id)?.job_title ?? null,
  }));
}

function mergeWorkspaceMembers(
  employees: EmployeeRecord[],
  members: WorkspaceMember[],
): EmployeeRecord[] {
  const linkedUserIds = new Set(employees.map((e) => e.user_id).filter(Boolean));

  const extras: EmployeeRecord[] = [];

  for (const member of members) {
    if (linkedUserIds.has(member.user_id)) continue;

    extras.push({
      id: `workspace-${member.user_id}`,
      full_name: member.full_name ?? "Unnamed",
      email: "",
      department: null,
      job_title: member.job_title,
      hire_date: member.joined_at ? member.joined_at.slice(0, 10) : null,
      salary_cents: null,
      salary_type: null,
      phone: null,
      skills: null,
      status: "active",
      user_id: member.user_id,
    });
  }

  const merged = dedupeEmployeeRows([...employees, ...extras]);
  return merged;
}

export async function dedupeOrganizationEmployees(orgId: string): Promise<boolean> {
  const { error } = await supabase.rpc("dedupe_organization_employees", { _org_id: orgId });
  if (error) {
    console.warn("Employee dedupe skipped:", error.message);
    return false;
  }
  return true;
}

export async function ensureOrganizationEmployeeRecords(orgId: string): Promise<boolean> {
  const { error } = await supabase.rpc("ensure_organization_employee_records", { _org_id: orgId });
  if (error) {
    console.warn("Employee record sync skipped:", error.message);
    return false;
  }
  return true;
}

export async function loadEmployeeDirectory(orgId: string): Promise<EmployeeRecord[]> {
  await ensureOrganizationEmployeeRecords(orgId);
  await dedupeOrganizationEmployees(orgId);

  const employees = dedupeEmployeeRows(await fetchEmployeeRows(orgId));

  try {
    const members = await fetchWorkspaceMembers(orgId);
    return mergeWorkspaceMembers(employees, members);
  } catch (err) {
    console.warn("Workspace member merge skipped:", err);
    return employees;
  }
}

export function isVirtualEmployeeRecord(employee: EmployeeRecord) {
  return employee.id.startsWith("workspace-");
}

export const ENSURE_EMPLOYEES_MIGRATION_HINT =
  "Run supabase/migrations/20260622_ensure_employee_records.sql and 20260623_dedupe_employees.sql in Supabase SQL Editor.";
