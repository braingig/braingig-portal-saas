import { EMPLOYEE_FORM_DEFAULTS, type EmployeeFormValues } from "@/lib/employees/constants";
import type { EmployeeRecord } from "@/lib/employees/workspace-status";

export function employeeToFormValues(employee: EmployeeRecord): EmployeeFormValues {
  return {
    fullName: employee.full_name,
    email: employee.email,
    phone: employee.phone ?? "",
    department: employee.department ?? "",
    salaryType: employee.salary_type ?? "fixed",
    salaryAmount: employee.salary_cents != null ? String(employee.salary_cents / 100) : "",
    hireDate: employee.hire_date ?? "",
    skills: employee.skills ?? "",
  };
}

export function emptyEmployeeFormValues(): EmployeeFormValues {
  return { ...EMPLOYEE_FORM_DEFAULTS };
}
