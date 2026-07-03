import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Timer } from "lucide-react";
import type { TaskCommentRecord } from "@/lib/tasks/comments";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskTimeEntry } from "@/lib/tasks/types";

export type TaskActivityItem = {
  id: string;
  at: string;
  text: string;
  detail?: string;
};

type AuditRow = {
  id: string;
  action: string;
  actor_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type NotifRow = {
  id: string;
  type: string;
  title: string;
  created_at: string;
};

type TaskActivityFeedProps = {
  timeEntries: TaskTimeEntry[];
  comments: TaskCommentRecord[];
  audits: AuditRow[];
  notifs?: NotifRow[];
  nameOf: (userId: string | null | undefined) => string;
  previewCount?: number;
  sortDescending?: boolean;
  className?: string;
  showHeader?: boolean;
};

const DEFAULT_PREVIEW = 5;

function activityWhen(iso: string) {
  return format(new Date(iso), "MMM d 'at' h:mm a");
}

export function buildTaskActivityItems({
  timeEntries,
  comments,
  audits,
  notifs = [],
  nameOf,
  sortDescending = false,
}: Omit<TaskActivityFeedProps, "previewCount" | "className" | "showHeader">): TaskActivityItem[] {
  const items: TaskActivityItem[] = [];

  for (const entry of timeEntries) {
    const secs = entry.duration_seconds ?? 0;
    if (secs <= 0) continue;
    const when = new Date(entry.started_at);
    items.push({
      id: `time-${entry.id}`,
      at: entry.started_at,
      text: `${nameOf(entry.user_id)} tracked time`,
      detail: `${formatDurationHuman(secs)} on ${format(when, "MMM d")}`,
    });
  }

  for (const comment of comments) {
    const mentioned = (comment.mentions ?? []).length > 0;
    items.push({
      id: `comment-${comment.id}`,
      at: comment.created_at,
      text: mentioned
        ? `${nameOf(comment.author_id)} mentioned someone`
        : `${nameOf(comment.author_id)} commented`,
    });
  }

  for (const row of audits) {
    const meta = row.metadata ?? {};
    let text = `${nameOf(row.actor_id)} updated this task`;
    if (row.action === "task.created") text = `${nameOf(row.actor_id)} created this task`;
    else if (row.action === "task.updated" && meta.status) {
      text = `${nameOf(row.actor_id)} changed status to ${String(meta.status).replace(/_/g, " ")}`;
    } else if (row.action === "task.updated" && meta.assigneeCount !== undefined) {
      text = `${nameOf(row.actor_id)} updated assignees`;
    }
    items.push({ id: `audit-${row.id}`, at: row.created_at, text });
  }

  for (const n of notifs) {
    if (n.type.includes("mention") || n.title.toLowerCase().includes("mention")) {
      items.push({ id: `notif-${n.id}`, at: n.created_at, text: n.title });
    }
  }

  const sorted = items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return sortDescending ? sorted.reverse() : sorted;
}

export function TaskActivityFeed({
  timeEntries,
  comments,
  audits,
  notifs = [],
  nameOf,
  previewCount = DEFAULT_PREVIEW,
  sortDescending = false,
  className,
  showHeader = true,
}: TaskActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);

  const activity = useMemo(
    () => buildTaskActivityItems({ timeEntries, comments, audits, notifs, nameOf, sortDescending }),
    [timeEntries, comments, audits, notifs, nameOf, sortDescending],
  );

  const visible = expanded ? activity : activity.slice(0, previewCount);
  const hiddenCount = activity.length - previewCount;

  if (activity.length === 0) {
    return (
      <div className={className}>
        {showHeader && (
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </h4>
        )}
        <p className="text-xs text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </h4>
      )}
      <ul className="space-y-2.5">
        {visible.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ul>
      {hiddenCount > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-medium text-brand transition-colors hover:text-brand/80"
        >
          View full activity ({activity.length})
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: TaskActivityItem }) {
  return (
    <li>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{item.text}</p>
      <time className="mt-0.5 block text-[10px] tabular-nums text-muted-foreground/60">
        {activityWhen(item.at)}
      </time>
      {item.detail && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <Timer className="size-2.5 shrink-0" />
          {item.detail}
        </p>
      )}
    </li>
  );
}
