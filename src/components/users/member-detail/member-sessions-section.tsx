import { formatDateTime, formatDuration } from "@/lib/format";
import type { MemberSession } from "@/lib/users/member-detail";
import { MemberDetailSection } from "./member-detail-section";

type MemberSessionsSectionProps = {
  sessions: MemberSession[];
  lastLoginAt: string | null;
};

export function MemberSessionsSection({ sessions, lastLoginAt }: MemberSessionsSectionProps) {
  return (
    <MemberDetailSection title="Sessions">
      {lastLoginAt && (
        <p className="mb-3 text-xs text-muted-foreground">
          Last sign-in: {formatDateTime(lastLoginAt)}
        </p>
      )}
      {sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tracked work sessions yet.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-border bg-surface/50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium">
                  {session.taskTitle ?? "General"}
                </p>
                <span className="shrink-0 text-xs font-semibold text-brand">
                  {formatDuration(session.durationSeconds)}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatDateTime(session.startedAt)}
                {session.endedAt ? ` – ${formatDateTime(session.endedAt)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </MemberDetailSection>
  );
}
