import { formatDateTime, formatDuration, formatRelativeTime } from "@/lib/format";
import type { MemberAuditEvent, MemberTaskActivity } from "@/lib/users/member-detail";
import { MemberDetailSection } from "./member-detail-section";

type MemberActivitySectionProps = {
  taskActivity: MemberTaskActivity[];
  auditEvents: MemberAuditEvent[];
};

export function MemberActivitySection({ taskActivity, auditEvents }: MemberActivitySectionProps) {
  return (
    <MemberDetailSection title="Activity">
      {taskActivity.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Time on tasks
          </p>
          <div className="space-y-2">
            {taskActivity.map((item) => (
              <div
                key={item.taskId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.taskTitle}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.sessionCount} session{item.sessionCount === 1 ? "" : "s"} · Last{" "}
                    {formatRelativeTime(item.lastWorkedAt)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-brand">
                  {formatDuration(item.totalSeconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {taskActivity.length === 0 && (
        <p className="mb-4 text-xs text-muted-foreground">No task time logged yet.</p>
      )}

      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Recent events
      </p>
      {auditEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground">No audit events for this user.</p>
      ) : (
        <div className="space-y-2">
          {auditEvents.map((event) => (
            <div key={event.id} className="rounded-lg border border-border px-3 py-2">
              <p className="text-xs font-medium text-brand">{event.action}</p>
              <p className="text-[10px] text-muted-foreground">
                {event.entityType} · {formatDateTime(event.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </MemberDetailSection>
  );
}
