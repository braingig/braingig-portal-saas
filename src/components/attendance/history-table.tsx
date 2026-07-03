import { Pencil, Plus, Trash2 } from "lucide-react";
import { AttendanceStatusBadge } from "@/components/attendance/status-badge";
import { AttendanceSectionHeader } from "@/components/attendance/today-summary";
import {
  COMPACT_CARD,
  INPUT_CLASS,
  SECONDARY_TEXT,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
} from "@/components/attendance/attendance-styles";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/app-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ATTENDANCE_STATUSES } from "@/lib/attendance/constants";
import { formatMinutes, formatTime } from "@/lib/attendance/date-utils";
import { formatDate } from "@/lib/format";
import type { AttendanceFilters, AttendanceMember, AttendanceRecord } from "@/lib/attendance/types";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = 5;

function HistoryEmptyState() {
  return (
    <div className="py-5 text-center">
      <p className="text-sm font-medium text-foreground">No attendance records yet.</p>
      <p className={SECONDARY_TEXT}>Your recent check-ins will appear here.</p>
    </div>
  );
}

type PreviewProps = {
  records: AttendanceRecord[];
  members: AttendanceMember[];
  showEmployeeColumn?: boolean;
  onViewAll: () => void;
  onSelectRecord?: (record: AttendanceRecord) => void;
};

export function HistoryPreview({
  records,
  members,
  showEmployeeColumn = true,
  onViewAll,
  onSelectRecord,
}: PreviewProps) {
  const nameMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  const preview = records.slice(0, PREVIEW_ROWS);
  const colCount = showEmployeeColumn ? 5 : 4;

  return (
    <section>
      <AttendanceSectionHeader title="Recent Attendance" actionLabel="View Full History" onAction={onViewAll} />
      <div className={COMPACT_CARD}>
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                {showEmployeeColumn && <TableHead className={TABLE_HEAD}>Employee</TableHead>}
                <TableHead className={TABLE_HEAD}>Check In</TableHead>
                <TableHead className={TABLE_HEAD}>Working Hours</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount}>
                    <HistoryEmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                preview.map((r) => (
                  <TableRow
                    key={r.id}
                    className={cn(TABLE_ROW, onSelectRecord && "cursor-pointer")}
                    onClick={() => onSelectRecord?.(r)}
                  >
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatDate(r.work_date)}</TableCell>
                    {showEmployeeColumn && (
                      <TableCell className={TABLE_CELL}>{nameMap.get(r.user_id) ?? "—"}</TableCell>
                    )}
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatTime(r.clock_in)}</TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>
                      {formatMinutes(r.working_minutes ?? 0)}
                    </TableCell>
                    <TableCell className={TABLE_CELL}>
                      <AttendanceStatusBadge status={r.status} />
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

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: AttendanceRecord[];
  members: AttendanceMember[];
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
  canManage: boolean;
  showEmployeeColumn?: boolean;
  onAdd: () => void;
  onEdit: (record: AttendanceRecord) => void;
  onDelete: (record: AttendanceRecord) => void;
};

export function HistoryModal({
  open,
  onOpenChange,
  records,
  members,
  filters,
  onFiltersChange,
  canManage,
  showEmployeeColumn = true,
  onAdd,
  onEdit,
  onDelete,
}: ModalProps) {
  const nameMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];

  const filtered = records.filter((r) => {
    if (filters.userId && r.user_id !== filters.userId) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.department) {
      const dept = members.find((m) => m.user_id === r.user_id)?.department;
      if (dept !== filters.department) return false;
    }
    return true;
  });

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Attendance History"
      description="Filter, review, and manage attendance records."
      size="xl"
      className="max-w-5xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              className={INPUT_CLASS}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              className={INPUT_CLASS}
            />
            {showEmployeeColumn && (
              <select
                value={filters.userId}
                onChange={(e) => onFiltersChange({ ...filters, userId: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="">All employees</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={filters.department}
              onChange={(e) => onFiltersChange({ ...filters, department: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">All statuses</option>
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          {canManage && (
            <Button onClick={onAdd} size="sm" className="shrink-0 bg-brand text-brand-foreground">
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                {showEmployeeColumn && <TableHead className={TABLE_HEAD}>Employee</TableHead>}
                <TableHead className={TABLE_HEAD}>Check In</TableHead>
                <TableHead className={TABLE_HEAD}>Check Out</TableHead>
                <TableHead className={TABLE_HEAD}>Break</TableHead>
                <TableHead className={TABLE_HEAD}>Hours</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
                {canManage && <TableHead className="w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showEmployeeColumn ? 8 : 7}>
                    <HistoryEmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id} className={TABLE_ROW}>
                    <TableCell className={TABLE_CELL}>{formatDate(r.work_date)}</TableCell>
                    {showEmployeeColumn && <TableCell className={TABLE_CELL}>{nameMap.get(r.user_id) ?? "—"}</TableCell>}
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatTime(r.clock_in)}</TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>
                      {r.missed_checkout ? (
                        <span className="text-danger">Missed</span>
                      ) : (
                        formatTime(r.clock_out)
                      )}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatMinutes(r.break_minutes)}</TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>{formatMinutes(r.working_minutes ?? 0)}</TableCell>
                    <TableCell className={TABLE_CELL}>
                      <AttendanceStatusBadge
                        status={r.status}
                        suffix={r.late_minutes > 0 ? formatMinutes(r.late_minutes) : undefined}
                      />
                    </TableCell>
                    {canManage && (
                      <TableCell className={TABLE_CELL}>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={r.id.startsWith("leave-")}
                            onClick={() => onEdit(r)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={r.id.startsWith("leave-")}
                            onClick={() => onDelete(r)}
                          >
                            <Trash2 className="size-3.5 text-danger" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppModal>
  );
}
