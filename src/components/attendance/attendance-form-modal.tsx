import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { ATTENDANCE_STATUSES } from "@/lib/attendance/constants";
import type { AttendanceFormValues, AttendanceMember, AttendanceRecord } from "@/lib/attendance/types";
import { toDateKey } from "@/lib/attendance/date-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: AttendanceMember[];
  initial?: AttendanceRecord | null;
  onSave: (values: AttendanceFormValues, recordId?: string) => Promise<void>;
};

function toTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AttendanceFormModal({ open, onOpenChange, members, initial, onSave }: Props) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<AttendanceFormValues>({
    user_id: "",
    work_date: toDateKey(),
    clock_in: "",
    clock_out: "",
    status: "present",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        user_id: initial.user_id,
        work_date: initial.work_date,
        clock_in: toTimeInput(initial.clock_in),
        clock_out: toTimeInput(initial.clock_out),
        status: initial.status,
        notes: initial.notes ?? "",
      });
    } else {
      setForm({
        user_id: members[0]?.user_id ?? "",
        work_date: toDateKey(),
        clock_in: "",
        clock_out: "",
        status: "present",
        notes: "",
      });
    }
  }, [open, initial, members]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form, initial?.id);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Edit Attendance" : "Add Attendance"}
      description="Manually add or correct attendance records."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-brand text-brand-foreground" disabled={busy} onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Employee</span>
          <select
            required
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            className={inputClass}
            disabled={Boolean(initial)}
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Date</span>
          <input
            required
            type="date"
            value={form.work_date}
            onChange={(e) => setForm({ ...form, work_date: e.target.value })}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Check In</span>
            <input
              type="time"
              value={form.clock_in}
              onChange={(e) => setForm({ ...form, clock_in: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Check Out</span>
            <input
              type="time"
              value={form.clock_out}
              onChange={(e) => setForm({ ...form, clock_out: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceFormValues["status"] })}
            className={inputClass}
          >
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputClass}
            rows={3}
          />
        </label>
      </form>
    </AppModal>
  );
}
