import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { INPUT_CLASS } from "@/components/attendance/attendance-styles";
import type { JobFormValues } from "@/lib/recruitment/types";

const DEFAULT: JobFormValues = {
  title: "",
  department: "",
  description: "",
  open_positions: 1,
  closing_date: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JobFormValues) => Promise<void>;
};

export function JobFormModal({ open, onOpenChange, onSubmit }: Props) {
  const [values, setValues] = useState<JobFormValues>(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setValues(DEFAULT);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Job"
      description="Post a new open position."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="job-form" size="sm" disabled={saving} className="bg-brand text-brand-foreground">
            {saving ? "Creating…" : "Create Job"}
          </Button>
        </div>
      }
    >
      <form id="job-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Job title</label>
          <input
            required
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className={INPUT_CLASS}
            placeholder="e.g. Senior Product Designer"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Department</label>
            <input
              value={values.department}
              onChange={(e) => setValues({ ...values, department: e.target.value })}
              className={INPUT_CLASS}
              placeholder="Engineering"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Open positions</label>
            <input
              type="number"
              min={1}
              value={values.open_positions}
              onChange={(e) => setValues({ ...values, open_positions: Number(e.target.value) || 1 })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Closing date</label>
          <input
            type="date"
            value={values.closing_date}
            onChange={(e) => setValues({ ...values, closing_date: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            rows={3}
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            className={INPUT_CLASS}
            placeholder="Role summary and requirements…"
          />
        </div>
      </form>
    </AppModal>
  );
}
