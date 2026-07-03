import { AttendanceStatusBadge } from "@/components/attendance/status-badge";
import { AttendanceSectionHeader } from "@/components/attendance/today-summary";
import { COMPACT_CARD, INPUT_CLASS, SECONDARY_TEXT, TABLE_CELL, TABLE_HEAD, TABLE_ROW, CARD_TITLE } from "@/components/attendance/attendance-styles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatTime } from "@/lib/attendance/date-utils";
import type { AttendanceMember, AttendanceRecord, TodaySummary } from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

export type TeamRow = {
  member: AttendanceMember;
  record: AttendanceRecord | null;
  onLeave: boolean;
  status: string;
  clockState: "working" | "checked_out" | "not_started" | "on_leave";
};

const PREVIEW_ROWS = 5;

const SUMMARY_KEYS = [
  { key: "present" as const, label: "Present" },
  { key: "late" as const, label: "Late" },
  { key: "absent" as const, label: "Absent" },
  { key: "onLeave" as const, label: "On Leave" },
  { key: "currentlyWorking" as const, label: "Working" },
];

type PreviewProps = {
  rows: TeamRow[];
  onViewAll: () => void;
  onSelectMember?: (row: TeamRow) => void;
};

export function TeamAttendancePreview({ rows, onViewAll, onSelectMember }: PreviewProps) {
  const preview = rows.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <AttendanceSectionHeader title="Team Attendance" actionLabel="View All" onAction={onViewAll} />
      <div className={COMPACT_CARD}>
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Member</TableHead>
                <TableHead className={TABLE_HEAD}>Check In</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-5 text-center">
                    <p className="text-sm font-medium text-foreground">No team members found.</p>
                    <p className={SECONDARY_TEXT}>Team attendance will appear here.</p>
                  </TableCell>
                </TableRow>
              ) : (
                preview.map((row) => (
                  <TableRow
                    key={row.member.user_id}
                    className={cn(TABLE_ROW, onSelectMember && "cursor-pointer")}
                    onClick={() => onSelectMember?.(row)}
                  >
                    <TableCell className={cn(TABLE_CELL, "font-medium")}>{row.member.full_name}</TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatTime(row.record?.clock_in)}</TableCell>
                    <TableCell className={TABLE_CELL}>
                      <AttendanceStatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: TeamRow[];
  summary: TodaySummary;
  teamFilter: string;
  teams: { userId: string; label: string }[];
  onTeamFilterChange: (userId: string) => void;
  onSelectMember?: (row: TeamRow) => void;
};

export function TeamAttendanceDrawer({
  open,
  onOpenChange,
  rows,
  summary,
  teamFilter,
  teams,
  onTeamFilterChange,
  onSelectMember,
}: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base font-semibold">Team Attendance</SheetTitle>
          <SheetDescription className="text-xs">Today&apos;s team overview and status.</SheetDescription>
        </SheetHeader>

        {teams.length > 0 && (
          <select
            value={teamFilter}
            onChange={(e) => onTeamFilterChange(e.target.value)}
            className={cn(INPUT_CLASS, "mt-4 w-full")}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.userId} value={t.userId}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {SUMMARY_KEYS.map((s) => (
            <div key={s.key} className={COMPACT_CARD}>
              <p className={CARD_TITLE}>{s.label}</p>
              <p className="text-lg font-semibold">{summary[s.key]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Member</TableHead>
                <TableHead className={TABLE_HEAD}>Department</TableHead>
                <TableHead className={TABLE_HEAD}>Check In</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.member.user_id}
                  className={cn(TABLE_ROW, onSelectMember && "cursor-pointer")}
                  onClick={() => onSelectMember?.(row)}
                >
                  <TableCell className={cn(TABLE_CELL, "font-medium")}>{row.member.full_name}</TableCell>
                  <TableCell className={TABLE_CELL}>{row.member.department ?? "—"}</TableCell>
                  <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatTime(row.record?.clock_in)}</TableCell>
                  <TableCell className={TABLE_CELL}>
                    <AttendanceStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
