import { useState } from "react";
import { Filter } from "lucide-react";
import { LeaveCompactEmptyState } from "@/components/leave/leave-empty-state";
import { LeaveSectionHeader } from "@/components/leave/leave-section-header";
import { LeaveHistoryFiltersModal } from "@/components/leave/leave-history-filters-modal";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import {
  LEAVE_DENSE_CARD,
  LEAVE_LIST_ITEM,
  LEAVE_SECONDARY,
} from "@/components/leave/leave-styles";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_CELL, TABLE_HEAD, TABLE_ROW } from "@/components/attendance/attendance-styles";
import { computeLeaveDays, filterLeaveRequests, leaveTypeLabel } from "@/lib/leave/calculations";
import type { AttendanceMember } from "@/lib/attendance/types";
import type { LeaveFilters, LeaveRequest } from "@/lib/leave/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = 5;

type ListItemProps = {
  request: LeaveRequest;
  onSelect: (request: LeaveRequest) => void;
};

function LeaveListItem({ request, onSelect }: ListItemProps) {
  const days = computeLeaveDays(request.start_date, request.end_date, request.half_day);
  const range =
    request.start_date === request.end_date
      ? formatDate(request.start_date)
      : `${formatDate(request.start_date)} – ${formatDate(request.end_date)}`;

  return (
    <button type="button" className={LEAVE_LIST_ITEM} onClick={() => onSelect(request)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{leaveTypeLabel(request.leave_type)}</p>
        <p className={LEAVE_SECONDARY}>
          {range} · {days === 0.5 ? "0.5 day" : days === 1 ? "1 day" : `${days} days`}
          {request.created_at ? ` · Submitted ${formatDate(request.created_at)}` : ""}
        </p>
      </div>
      <LeaveStatusBadge status={request.status} />
    </button>
  );
}

type PreviewProps = {
  requests: LeaveRequest[];
  onViewAll: () => void;
  onSelect: (request: LeaveRequest) => void;
  showViewAll?: boolean;
  emptyDescription?: string;
};

export function LeaveHistoryPreview({
  requests,
  onViewAll,
  onSelect,
  showViewAll = true,
  emptyDescription = "Request your first leave using the button above.",
}: PreviewProps) {
  const preview = requests.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <LeaveSectionHeader
        title="Recent Leave Requests"
        actionLabel="View All"
        onAction={onViewAll}
        showAction={showViewAll}
      />
      <div className={preview.length === 0 ? "rounded-lg border border-border bg-card shadow-sm" : LEAVE_DENSE_CARD}>
        {preview.length === 0 ? (
          <LeaveCompactEmptyState
            title="No leave requests yet."
            description={emptyDescription}
          />
        ) : (
          <div className="divide-y divide-border">
            {preview.map((r) => (
              <LeaveListItem key={r.id} request={r} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: LeaveRequest[];
  members: AttendanceMember[];
  filters: LeaveFilters;
  onFiltersChange: (filters: LeaveFilters) => void;
  showEmployeeColumn?: boolean;
  onSelect: (request: LeaveRequest) => void;
};

export function LeaveHistoryModal({
  open,
  onOpenChange,
  requests,
  members,
  filters,
  onFiltersChange,
  showEmployeeColumn = false,
  onSelect,
}: ModalProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deptMap = new Map(members.map((m) => [m.user_id, m.department]));
  const nameMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  const filtered = filterLeaveRequests(requests, filters, deptMap);
  const colCount = showEmployeeColumn ? 5 : 4;

  const activeFilterCount = [
    filters.status,
    filters.leaveType,
    filters.userId,
    filters.department,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title="Leave History"
        description="Full history of leave requests."
        size="xl"
        footer={
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        }
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className={LEAVE_SECONDARY}>
            {filtered.length} request{filtered.length === 1 ? "" : "s"}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`}
          </p>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setFiltersOpen(true)}>
            <Filter className="size-3.5" />
            Filters
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                {showEmployeeColumn && <TableHead className={TABLE_HEAD}>Employee</TableHead>}
                <TableHead className={TABLE_HEAD}>Leave Type</TableHead>
                <TableHead className={TABLE_HEAD}>Date Range</TableHead>
                <TableHead className={TABLE_HEAD}>Days</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount}>
                    <LeaveCompactEmptyState
                      title="No leave requests yet."
                      description="Try adjusting your filters."
                    />
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
                    {showEmployeeColumn && (
                      <TableCell className={TABLE_CELL}>{nameMap.get(r.user_id) ?? "—"}</TableCell>
                    )}
                    <TableCell className={TABLE_CELL}>{leaveTypeLabel(r.leave_type)}</TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>
                      {formatDate(r.start_date)}
                      {r.start_date !== r.end_date && ` – ${formatDate(r.end_date)}`}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL, "tabular-nums")}>
                      {computeLeaveDays(r.start_date, r.end_date, r.half_day)}
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
      </AppModal>

      <LeaveHistoryFiltersModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        members={members}
        showEmployeeFilter={showEmployeeColumn}
      />
    </>
  );
}
