import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormSection } from "@/components/ui/form-field";
import { EMPLOYEE_FORM_DEFAULTS, SALARY_TYPES, type EmployeeFormValues } from "@/lib/employees/constants";
import { cn } from "@/lib/utils";

const fieldClass = "bg-surface border-border focus-visible:ring-brand/30";

type EmployeeFormProps = {
  values: EmployeeFormValues;
  onChange: (values: EmployeeFormValues) => void;
  mode: "create" | "edit";
  idPrefix?: string;
};

export function EmployeeForm({
  values,
  onChange,
  mode,
  idPrefix = "employee",
}: EmployeeFormProps) {
  function patch(partial: Partial<EmployeeFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="space-y-6">
      <FormSection title="">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor={`${idPrefix}-name`} required>
            <Input
              id={`${idPrefix}-name`}
              required
              placeholder="Full name"
              value={values.fullName}
              onChange={(e) => patch({ fullName: e.target.value })}
              className={fieldClass}
            />
          </FormField>

          <FormField label="Email" htmlFor={`${idPrefix}-email`} required>
            <Input
              id={`${idPrefix}-email`}
              required
              type="email"
              placeholder="name@company.com"
              value={values.email}
              onChange={(e) => patch({ email: e.target.value })}
              className={fieldClass}
            />
          </FormField>
        </div>

        {mode === "create" && (
          <FormField
            label="Password"
            htmlFor={`${idPrefix}-password`}
            required
            hint="Not stored in HR. The employee sets their password when they sign up with the workspace invite."
          >
            <Input
              id={`${idPrefix}-password`}
              type="password"
              disabled
              placeholder="Set at workspace sign-up"
              className={cn(fieldClass, "opacity-70")}
            />
          </FormField>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor={`${idPrefix}-phone`}>
            <Input
              id={`${idPrefix}-phone`}
              type="tel"
              placeholder="+1 555 000 0000"
              value={values.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              className={fieldClass}
            />
          </FormField>

          <FormField label="Department" htmlFor={`${idPrefix}-department`}>
            <Input
              id={`${idPrefix}-department`}
              placeholder="Engineering"
              value={values.department}
              onChange={(e) => patch({ department: e.target.value })}
              className={fieldClass}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Salary type" required>
            <Select
              value={values.salaryType}
              onValueChange={(v) => patch({ salaryType: v as EmployeeFormValues["salaryType"] })}
            >
              <SelectTrigger className={cn(fieldClass, "w-full")}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {SALARY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Salary amount"
            htmlFor={`${idPrefix}-salary`}
            hint={values.salaryType === "hourly" ? "Hourly rate in dollars" : "Annual salary in dollars"}
          >
            <Input
              id={`${idPrefix}-salary`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={values.salaryAmount}
              onChange={(e) => patch({ salaryAmount: e.target.value })}
              className={fieldClass}
            />
          </FormField>
        </div>

        <FormField label="Joining date" htmlFor={`${idPrefix}-hire-date`} required>
          <Input
            id={`${idPrefix}-hire-date`}
            required
            type="date"
            value={values.hireDate}
            onChange={(e) => patch({ hireDate: e.target.value })}
            className={fieldClass}
          />
        </FormField>

        <FormField
          label="Skills"
          htmlFor={`${idPrefix}-skills`}
          hint="Comma-separated, e.g. React, TypeScript, Node.js"
        >
          <Input
            id={`${idPrefix}-skills`}
            placeholder="React, TypeScript, Node.js"
            value={values.skills}
            onChange={(e) => patch({ skills: e.target.value })}
            className={fieldClass}
          />
        </FormField>
      </FormSection>
    </div>
  );
}

export { EMPLOYEE_FORM_DEFAULTS };
