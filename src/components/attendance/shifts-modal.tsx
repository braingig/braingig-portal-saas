import { useEffect, useState } from "react";
import { DAY_NAMES } from "@/lib/attendance/constants";
import { INPUT_CLASS, SECONDARY_TEXT } from "@/components/attendance/attendance-styles";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/app-modal";
import type { AttendanceMember, WorkShift } from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shifts: WorkShift[];
  members: AttendanceMember[];
  assignments: Map<string, string>;
  onSaveShift: (shift: WorkShift, shiftId?: string) => Promise<void>;
  onAssignShift: (userId: string, shiftId: string) => Promise<void>;
};

export function ShiftsModal({
  open,
  onOpenChange,
  shifts,
  members,
  assignments,
  onSaveShift,
  onAssignShift,
}: Props) {
  const [editing, setEditing] = useState<WorkShift | null>(shifts[0] ?? null);
  const [assignUser, setAssignUser] = useState(members[0]?.user_id ?? "");
  const [assignShiftId, setAssignShiftId] = useState(shifts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEditing(shifts[0] ?? null);
      setAssignUser(members[0]?.user_id ?? "");
      setAssignShiftId(shifts[0]?.id ?? "");
    }
  }, [open, shifts, members]);

  async function saveShift() {
    if (!editing) return;
    setBusy(true);
    try {
      await onSaveShift(editing, editing.id);
    } finally {
      setBusy(false);
    }
  }

  async function assign() {
    if (!assignUser || !assignShiftId) return;
    setBusy(true);
    try {
      await onAssignShift(assignUser, assignShiftId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Shift Management"
      description="Configure shifts and assign employees."
      size="lg"
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">Edit Shift</p>
          {editing && (
            <>
              <div className="grid gap-2 sm:grid-cols-4">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="Shift name"
                />
                <input
                  type="time"
                  value={editing.start_time.slice(0, 5)}
                  onChange={(e) => setEditing({ ...editing, start_time: `${e.target.value}:00` })}
                  className={INPUT_CLASS}
                />
                <input
                  type="time"
                  value={editing.end_time.slice(0, 5)}
                  onChange={(e) => setEditing({ ...editing, end_time: `${e.target.value}:00` })}
                  className={INPUT_CLASS}
                />
                <Button onClick={saveShift} disabled={busy} className="bg-brand text-brand-foreground">
                  Save
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAY_NAMES.map((name, idx) => {
                  const off = editing.weekly_off_days.includes(idx);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        const days = off
                          ? editing.weekly_off_days.filter((d) => d !== idx)
                          : [...editing.weekly_off_days, idx];
                        setEditing({ ...editing, weekly_off_days: days.sort() });
                      }}
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        off ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
                <span className={SECONDARY_TEXT}>Weekly off</span>
              </div>
            </>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Assign Employee</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <select value={assignUser} onChange={(e) => setAssignUser(e.target.value)} className={INPUT_CLASS}>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name}
                </option>
              ))}
            </select>
            <select value={assignShiftId} onChange={(e) => setAssignShiftId(e.target.value)} className={INPUT_CLASS}>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
            <Button onClick={assign} disabled={busy} variant="outline">
              Assign
            </Button>
          </div>
          <p className={cn(SECONDARY_TEXT, "mt-2")}>
            Current assignments are shown when selecting an employee above.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Assigned Shifts</p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {members.filter((m) => assignments.has(m.user_id)).length === 0 ? (
              <p className={cn(SECONDARY_TEXT, "px-3 py-4")}>No assignments yet.</p>
            ) : (
              members
                .filter((m) => assignments.has(m.user_id))
                .map((m) => {
                  const shift = shifts.find((s) => s.id === assignments.get(m.user_id));
                  return (
                    <div key={m.user_id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{m.full_name}</span>
                      <span className="text-muted-foreground">
                        {shift?.name ?? "—"} ({shift?.start_time.slice(0, 5)} – {shift?.end_time.slice(0, 5)})
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
}