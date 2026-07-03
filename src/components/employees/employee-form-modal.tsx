import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EMPLOYEE_FORM_DEFAULTS, type EmployeeFormValues } from "@/lib/employees/constants";
import { employeeToFormValues } from "@/lib/employees/mappers";
import {
  createEmployeeRecord,
  EMPLOYEE_FIELDS_MIGRATION_HINT,
  updateEmployeeRecord,
} from "@/lib/employees/persist";
import type { EmployeeRecord } from "@/lib/employees/workspace-status";
import { logAudit } from "@/lib/audit";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import { toast } from "sonner";

type EmployeeFormModalProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  employee?: EmployeeRecord | null;
  onSuccess: () => void;
};

export function EmployeeFormModal({
  mode,
  open,
  onOpenChange,
  orgId,
  employee,
  onSuccess,
}: EmployeeFormModalProps) {
  const [values, setValues] = useState<EmployeeFormValues>(EMPLOYEE_FORM_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === "edit";
  const formId = isEdit ? "edit-employee-form" : "create-employee-form";

  useEffect(() => {
    if (!open) return;
    if (isEdit && employee) {
      setValues(employeeToFormValues(employee));
    } else {
      setValues(EMPLOYEE_FORM_DEFAULTS);
    }
  }, [open, isEdit, employee]);

  function handleOpenChange(next: boolean) {
    if (!next) setValues(EMPLOYEE_FORM_DEFAULTS);
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!values.fullName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!values.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!values.hireDate) {
      toast.error("Joining date is required");
      return;
    }
    if (isEdit && !employee) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateEmployeeRecord(employee!.id, values);
        await logAudit("employee.updated", "employee", employee!.id, { name: values.fullName });
        toast.success("Employee updated");
      } else {
        const data = await createEmployeeRecord(orgId, values);
        await logAudit("employee.created", "employee", data?.id, { name: values.fullName });
        toast.success("Employee added");
      }

      onSuccess();
      handleOpenChange(false);
    } catch (err: unknown) {
      if (err && typeof err === "object" && isMissingColumnError(err as { code?: string; message?: string })) {
        toast.warning(`Saved with basic fields only. ${EMPLOYEE_FIELDS_MIGRATION_HINT}`);
        onSuccess();
        handleOpenChange(false);
        return;
      }
      const msg = err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "add"} employee`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Edit employee" : "Add employee"}
      description={
        isEdit
          ? "Update HR record details for this employee."
          : "Add a new employee to your HR directory."
      }
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="border-border bg-background hover:bg-surface"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={submitting}
            className="bg-brand text-brand-foreground hover:brightness-110"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add employee"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <EmployeeForm
          values={values}
          onChange={setValues}
          mode={mode}
          idPrefix={isEdit ? "edit-employee" : "employee"}
        />
      </form>
    </AppModal>
  );
}
