import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { INPUT_CLASS } from "@/components/attendance/attendance-styles";
import type { CandidateFormValues, JobPosting } from "@/lib/recruitment/types";

const DEFAULT: CandidateFormValues = {
  full_name: "",
  email: "",
  phone: "",
  job_posting_id: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobPosting[];
  onSubmit: (values: CandidateFormValues) => Promise<void>;
};

export function CandidateFormModal({ open, onOpenChange, jobs, onSubmit }: Props) {
  const [values, setValues] = useState<CandidateFormValues>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const openJobs = jobs.filter((j) => j.status === "open");

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
      title="Add Candidate"
      description="Add a new candidate to the hiring pipeline."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="candidate-form" size="sm" disabled={saving} className="bg-brand text-brand-foreground">
            {saving ? "Adding…" : "Add Candidate"}
          </Button>
        </div>
      }
    >
      <form id="candidate-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Full name</label>
          <input
            required
            value={values.full_name}
            onChange={(e) => setValues({ ...values, full_name: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <input
              required
              type="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
            <input
              value={values.phone}
              onChange={(e) => setValues({ ...values, phone: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Applied position</label>
          <select
            value={values.job_posting_id}
            onChange={(e) => setValues({ ...values, job_posting_id: e.target.value })}
            className={INPUT_CLASS}
          >
            <option value="">No position selected</option>
            {openJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </form>
    </AppModal>
  );
}
