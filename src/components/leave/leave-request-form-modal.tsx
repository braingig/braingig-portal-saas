import { useEffect, useMemo, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from "@/lib/leave/constants";
import { computeLeaveDays, formatLeaveDays } from "@/lib/leave/calculations";
import type { LeaveFormValues } from "@/lib/leave/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LeaveFormValues) => Promise<void>;
};

const EMPTY: LeaveFormValues = {
  leave_type: "annual",
  start_date: "",
  end_date: "",
  half_day: false,
  reason: "",
  attachment: null,
};

export function LeaveRequestFormModal({ open, onOpenChange, onSubmit }: Props) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<LeaveFormValues>(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError("");
  }, [open]);

  const totalDays = useMemo(() => {
    if (!form.start_date || !form.end_date) return null;
    if (form.end_date < form.start_date) return null;
    return computeLeaveDays(form.start_date, form.end_date, form.half_day);
  }, [form.start_date, form.end_date, form.half_day]);

  const canHalfDay = form.start_date && form.end_date && form.start_date === form.end_date;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.end_date < form.start_date) {
      setError("End date cannot be before start date.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Request Leave"
      description="Submit a new leave request for approval."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-brand text-brand-foreground" disabled={busy} onClick={submit}>
            Submit Request
          </Button>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Leave Type</span>
          <select
            required
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            className={inputClass}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Start Date</span>
            <input
              required
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  start_date: e.target.value,
                  end_date: form.end_date && form.end_date < e.target.value ? e.target.value : form.end_date,
                })
              }
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">End Date</span>
            <input
              required
              type="date"
              min={form.start_date || undefined}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        {canHalfDay && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.half_day}
              onChange={(e) => setForm({ ...form, half_day: e.target.checked })}
              className="rounded border-border"
            />
            <span>Half day</span>
          </label>
        )}

        {totalDays != null && (
          <p className="rounded-md bg-brand/5 px-3 py-2 text-sm text-brand">
            Total leave days: <strong>{formatLeaveDays(totalDays)}</strong>
          </p>
        )}

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Reason</span>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className={inputClass}
            placeholder="Brief reason for your leave request"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">Attachment (optional)</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] ?? null })}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
    </AppModal>
  );
}
