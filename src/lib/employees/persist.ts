import { supabase } from "@/integrations/supabase/client";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import type { EmployeeFormValues } from "@/lib/employees/constants";
import { normalizeEmail } from "@/lib/employees/workspace-status";

function salaryCents(amount: string) {
  if (!amount.trim()) return null;
  const parsed = parseFloat(amount);
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

function buildExtendedPayload(orgId: string, values: EmployeeFormValues) {
  return {
    organization_id: orgId,
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    department: values.department.trim() || null,
    salary_type: values.salaryType,
    salary_cents: salaryCents(values.salaryAmount),
    hire_date: values.hireDate || null,
    skills: values.skills.trim() || null,
  };
}

function buildBasePayload(orgId: string, values: EmployeeFormValues) {
  return {
    organization_id: orgId,
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    department: values.department.trim() || null,
    salary_cents: salaryCents(values.salaryAmount),
    hire_date: values.hireDate || null,
  };
}

export async function createEmployeeRecord(orgId: string, values: EmployeeFormValues) {
  const email = values.email.trim();
  const { data: existingRows, error: lookupError } = await supabase
    .from("employees")
    .select("id, full_name, email")
    .eq("organization_id", orgId);

  if (lookupError) throw lookupError;

  const duplicate = (existingRows ?? []).find(
    (row) => normalizeEmail(row.email) === normalizeEmail(email),
  );
  if (duplicate) {
    throw new Error(
      `An employee record already exists for ${duplicate.full_name} with this email. Edit the existing record instead.`,
    );
  }

  let payload = buildExtendedPayload(orgId, values);
  let { data, error } = await supabase.from("employees").insert(payload).select().single();

  if (error && isMissingColumnError(error)) {
    payload = buildBasePayload(orgId, values);
    ({ data, error } = await supabase.from("employees").insert(payload).select().single());
  }

  if (error) throw error;
  return data;
}

export async function updateEmployeeRecord(employeeId: string, values: EmployeeFormValues) {
  let payload = {
    full_name: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    department: values.department.trim() || null,
    salary_type: values.salaryType,
    salary_cents: salaryCents(values.salaryAmount),
    hire_date: values.hireDate || null,
    skills: values.skills.trim() || null,
  };

  let { error } = await supabase.from("employees").update(payload).eq("id", employeeId);

  if (error && isMissingColumnError(error)) {
    payload = {
      full_name: values.fullName.trim(),
      email: values.email.trim(),
      department: values.department.trim() || null,
      salary_cents: salaryCents(values.salaryAmount),
      hire_date: values.hireDate || null,
    };
    ({ error } = await supabase.from("employees").update(payload).eq("id", employeeId));
  }

  if (error) throw error;
}

export const EMPLOYEE_FIELDS_MIGRATION_HINT =
  "Run supabase/migrations/20260621_employee_fields.sql in Supabase SQL Editor for phone, salary type, and skills.";
