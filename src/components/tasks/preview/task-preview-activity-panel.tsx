import { useMemo } from "react";
import { format } from "date-fns";
import { buildTaskActivityItems } from "@/components/tasks/details/task-activity-feed";
import type { TaskCommentRecord } from "@/lib/tasks/comments";
import type { TaskPreviewAudit } from "@/components/tasks/preview/use-task-preview-data";
import type { TaskTimeEntry } from "@/lib/tasks/types";

type TaskPreviewActivityPanelProps = {
  timeEntries: TaskTimeEntry[];
  comments: TaskCommentRecord[];
  audits: TaskPreviewAudit[];
  nameOf: (id: string | null | undefined) => string;
};

function timeAgo(iso: string) {
  return format(new Date(iso), "h:mm a");
}

export function TaskPreviewActivityPanel({
  timeEntries,
  comments,
  audits,
  nameOf,
}: TaskPreviewActivityPanelProps) {
  const activity = useMemo(
    () => buildTaskActivityItems({
      timeEntries,
      comments,
      audits,
      nameOf,
      sortDescending: true,
    }),
    [timeEntries, comments, audits, nameOf],
  );

  const visible = activity;

  return (
    <aside className="flex w-[min(38%,340px)] shrink-0 flex-col border-l border-border/50 bg-surface/20">
      <div className="flex shrink-0 items-center border-b border-border/40 px-4 py-3">
        <h3 className="text-[13px] font-normal text-muted-foreground">Activity</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {activity.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No activity yet</p>
        ) : (
          <ul className="space-y-4">
            {visible.map((item) => (
              <li key={item.id} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13px] leading-snug text-foreground/90">{item.text}</p>
                  {item.detail && (
                    <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{item.detail}</p>
                  )}
                </div>
                <time className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
                  {timeAgo(item.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
