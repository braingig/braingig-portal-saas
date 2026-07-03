import { AttendanceStatusBadge } from "@/components/attendance/status-badge";
import { SECONDARY_TEXT } from "@/components/attendance/attendance-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMinutes, formatTime } from "@/lib/attendance/date-utils";
import { formatDate } from "@/lib/format";
import type { AttendanceMember, AttendanceRecord } from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AttendanceMember | null;
  record: AttendanceRecord | null;
  dateLabel?: string;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={SECONDARY_TEXT}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function EmployeeAttendanceDrawer({ open, onOpenChange, member, record, dateLabel }: Props) {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="text-[20px] font-medium">{member.full_name}</SheetTitle>
          <SheetDescription className="text-[13px]">
            {dateLabel ?? (record ? formatDate(record.work_date) : "Attendance details")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 divide-y divide-border rounded-lg border border-border px-3">
          <DetailRow label="Department" value={member.department ?? "—"} />
          {record ? (
            <>
              <DetailRow label="Date" value={formatDate(record.work_date)} />
              <DetailRow label="Check In" value={formatTime(record.clock_in)} />
              <DetailRow
                label="Check Out"
                value={
                  record.missed_checkout ? (
                    <span className="text-danger">Missed check out</span>
                  ) : (
                    formatTime(record.clock_out)
                  )
                }
              />
              <DetailRow label="Break" value={formatMinutes(record.break_minutes)} />
              <DetailRow label="Working Hours" value={formatMinutes(record.working_minutes ?? 0)} />
              <DetailRow label="Overtime" value={formatMinutes(record.overtime_minutes)} />
              {record.late_minutes > 0 && (
                <DetailRow label="Late By" value={formatMinutes(record.late_minutes)} />
              )}
              <div className="flex items-center justify-between py-2">
                <span className={SECONDARY_TEXT}>Status</span>
                <AttendanceStatusBadge status={record.status} />
              </div>
              {record.notes && <DetailRow label="Notes" value={record.notes} />}
            </>
          ) : (
            <p className={cn(SECONDARY_TEXT, "py-4")}>No attendance record for this date.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}