import { LeaveCompactEmptyState } from "@/components/leave/leave-empty-state";
import { LeaveSectionHeader } from "@/components/leave/leave-section-header";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import {
  LEAVE_DENSE_CARD,
  LEAVE_LIST_ITEM,
  LEAVE_SECONDARY,
} from "@/components/leave/leave-styles";
import { INPUT_CLASS } from "@/components/attendance/attendance-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_CELL, TABLE_HEAD, TABLE_ROW } from "@/components/attendance/attendance-styles";
import { filterLeaveRequests, computeLeaveDays, leaveTypeLabel } from "@/lib/leave/calculations";
import { LEAVE_STATUSES, LEAVE_TYPES, LEAVE_TYPE_LABELS } from "@/lib/leave/constants";
import type { AttendanceMember } from "@/lib/attendance/types";
import type { LeaveFilters, LeaveRequest } from "@/lib/leave/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = 5;

type PreviewProps = {
  requests: LeaveRequest[];
  members: AttendanceMember[];
  onViewAll: () => void;
  onSelect: (request: LeaveRequest) => void;
  showViewAll?: boolean;
};

export function TeamLeavePreview({
  requests,
  members,
  onViewAll,
  onSelect,
  showViewAll = true,
}: PreviewProps) {
  const nameMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  const preview = requests.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <LeaveSectionHeader
        title="Team Leave"
        actionLabel="View All"
        onAction={onViewAll}
        showAction={showViewAll}
      />
      <div className={preview.length === 0 ? "rounded-lg border border-border bg-card shadow-sm" : LEAVE_DENSE_CARD}>
        {preview.length === 0 ? (
          <LeaveCompactEmptyState
            title="No team leave requests."
            description="Team leave will appear here when submitted."
          />
        ) : (
          <div className="divide-y divide-border">
            {preview.map((r) => {
              const days = computeLeaveDays(r.start_date, r.end_date, r.half_day);
              const range =
                r.start_date === r.end_date
                  ? formatDate(r.start_date)
                  : `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`;

              return (
              <button
                key={r.id}
                type="button"
                className={LEAVE_LIST_ITEM}
                onClick={() => onSelect(r)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {nameMap.get(r.user_id) ?? r.user_name ?? "—"}
                  </p>
                  <p className={LEAVE_SECONDARY}>
                    {leaveTypeLabel(r.leave_type)} · {range} ·{" "}
                    {days === 0.5 ? "0.5 day" : days === 1 ? "1 day" : `${days} days`}
                  </p>
                </div>
                <LeaveStatusBadge status={r.status} />
              </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: LeaveRequest[];
  members: AttendanceMember[];
  filters: LeaveFilters;
  onFiltersChange: (filters: LeaveFilters) => void;
  onSelect: (request: LeaveRequest) => void;
};

export function TeamLeaveDrawer({
  open,
  onOpenChange,
  requests,
  members,
  filters,
  onFiltersChange,
  onSelect,
}: DrawerProps) {
  const deptMap = new Map(members.map((m) => [m.user_id, m.department]));
  const nameMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];
  const filtered = filterLeaveRequests(requests, filters, deptMap);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>Team Leave</SheetTitle>
          <SheetDescription>Leave requests from your team.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className={INPUT_CLASS}
          >
            <option value="">All statuses</option>
            {LEAVE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filters.leaveType}
            onChange={(e) => onFiltersChange({ ...filters, leaveType: e.target.value })}
            className={INPUT_CLASS}
          >
            <option value="">All types</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>
                {LEAVE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
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
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Employee</TableHead>
                <TableHead className={TABLE_HEAD}>Type</TableHead>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-5 text-center">
                    <p className={LEAVE_SECONDARY}>No matching leave requests.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className={cn(TABLE_ROW, "cursor-pointer")}
                    onClick={() => {
                      onSelect(r);
                      onOpenChange(false);
                    }}
                  >
                    <TableCell className={cn(TABLE_CELL, "font-medium")}>
                      {nameMap.get(r.user_id) ?? "—"}
                    </TableCell>
                    <TableCell className={TABLE_CELL}>{leaveTypeLabel(r.leave_type)}</TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>
                      {formatDate(r.start_date)}
                    </TableCell>
                    <TableCell className={TABLE_CELL}>
                      <LeaveStatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
