import { INPUT_CLASS } from "@/components/attendance/attendance-styles";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { LEAVE_STATUSES, LEAVE_TYPES, LEAVE_TYPE_LABELS } from "@/lib/leave/constants";
import type { AttendanceMember } from "@/lib/attendance/types";
import type { LeaveFilters } from "@/lib/leave/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: LeaveFilters;
  onFiltersChange: (filters: LeaveFilters) => void;
  members: AttendanceMember[];
  showEmployeeFilter?: boolean;
};

export function LeaveHistoryFiltersModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  members,
  showEmployeeFilter,
}: Props) {
  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];

  function clear() {
    onFiltersChange({
      status: "",
      leaveType: "",
      userId: "",
      department: "",
      startDate: "",
      endDate: "",
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Filter Leave History"
      description="Narrow results by status, type, employee, or date."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={clear}>
            Clear
          </Button>
          <Button className="bg-brand text-brand-foreground" onClick={() => onOpenChange(false)}>
            Apply Filters
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Status</span>
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
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Leave Type</span>
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
        </label>
        {showEmployeeFilter && (
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Employee</span>
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
          </label>
        )}
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Department</span>
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
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">From</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">To</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
      </div>
    </AppModal>
  );
}
