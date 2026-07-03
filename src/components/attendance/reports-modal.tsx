import { Download } from "lucide-react";
import { CARD_TITLE, CARD_VALUE, COMPACT_CARD, INPUT_CLASS } from "@/components/attendance/attendance-styles";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/app-modal";
import { formatMinutes } from "@/lib/attendance/date-utils";
import { formatDate } from "@/lib/format";
import type { AttendanceFilters, AttendanceMember, AttendanceRecord, AttendanceReport } from "@/lib/attendance/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: AttendanceReport;
  records: AttendanceRecord[];
  members: AttendanceMember[];
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
  teams: { userId: string; label: string }[];
  showEmployeeFilter?: boolean;
};

function exportCsv(records: AttendanceRecord[], members: AttendanceMember[]) {
  const nameMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  const headers = ["Date", "Employee", "Check In", "Check Out", "Break (min)", "Working (min)", "Status"];
  const rows = records.map((r) => [
    r.work_date,
    nameMap.get(r.user_id) ?? r.user_id,
    r.clock_in ?? "",
    r.clock_out ?? "",
    String(r.break_minutes),
    String(r.working_minutes ?? ""),
    r.status,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-report-${filtersDate()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function filtersDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsModal({
  open,
  onOpenChange,
  report,
  records,
  members,
  filters,
  onFiltersChange,
  teams,
  showEmployeeFilter = true,
}: Props) {
  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];

  const filtered = records.filter((r) => {
    if (filters.userId && r.user_id !== filters.userId) return false;
    if (filters.department) {
      const dept = members.find((m) => m.user_id === r.user_id)?.department;
      if (dept !== filters.department) return false;
    }
    if (filters.teamUserId) {
      const ids = new Set(
        members
          .filter((m) => m.manager_id === filters.teamUserId || m.user_id === filters.teamUserId)
          .map((m) => m.user_id),
      );
      ids.add(filters.teamUserId);
      if (!ids.has(r.user_id)) return false;
    }
    if (r.work_date < filters.startDate || r.work_date > filters.endDate) return false;
    return true;
  });

  const cards = [
    { label: "Present Days", value: report.presentDays },
    { label: "Absent Days", value: report.absentDays },
    { label: "Late Days", value: report.lateDays },
    { label: "Leave Days", value: report.leaveDays },
    { label: "Total Hours", value: formatMinutes(report.totalWorkingMinutes) },
    { label: "Avg Hours", value: formatMinutes(report.averageWorkingMinutes) },
  ];

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Attendance Reports"
      description={`${formatDate(filters.startDate)} – ${formatDate(filters.endDate)}`}
      size="xl"
      className="max-w-3xl"
      footer={
        <Button variant="outline" onClick={() => exportCsv(filtered, members)}>
          <Download className="size-4" />
          Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
          {showEmployeeFilter && (
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
          {teams.length > 0 && (
            <select
              value={filters.teamUserId}
              onChange={(e) => onFiltersChange({ ...filters, teamUserId: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className={COMPACT_CARD}>
              <p className={CARD_TITLE}>{card.label}</p>
              <p className={CARD_VALUE}>{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppModal>
  );
}
