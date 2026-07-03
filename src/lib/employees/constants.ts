export const SALARY_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
] as const;

export type SalaryType = (typeof SALARY_TYPES)[number]["value"];

export type EmployeeFormValues = {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  salaryType: SalaryType;
  salaryAmount: string;
  hireDate: string;
  skills: string;
};

export const EMPLOYEE_FORM_DEFAULTS: EmployeeFormValues = {
  fullName: "",
  email: "",
  phone: "",
  department: "",
  salaryType: "fixed",
  salaryAmount: "",
  hireDate: "",
  skills: "",
};
