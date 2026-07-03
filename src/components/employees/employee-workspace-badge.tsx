import {
  WORKSPACE_STATUS_CLASS,
  WORKSPACE_STATUS_LABEL,
  type EmployeeWorkspaceStatus,
} from "@/lib/employees/workspace-status";
import { cn } from "@/lib/utils";

type EmployeeWorkspaceBadgeProps = {
  status: EmployeeWorkspaceStatus;
};

export function EmployeeWorkspaceBadge({ status }: EmployeeWorkspaceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        WORKSPACE_STATUS_CLASS[status],
      )}
    >
      {WORKSPACE_STATUS_LABEL[status]}
    </span>
  );
}
