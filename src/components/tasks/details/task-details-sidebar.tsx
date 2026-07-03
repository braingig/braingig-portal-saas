import { Clock } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { formatDate } from "@/lib/format";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskDetailProfile } from "@/lib/tasks/types";

type TaskDetailsMetaSidebarProps = {
  assignees: TaskDetailProfile[];
  createdBy: TaskDetailProfile | null;
  todaySeconds: number;
  totalSeconds: number;
  createdAt?: string;
  updatedAt?: string;
  folderName: string | null;
  estimatedHours: number | null;
  dueDate: string | null;
};

export function TaskDetailsMetaSidebar({
  assignees,
  createdBy,
  todaySeconds,
  totalSeconds,
  createdAt,
  updatedAt,
  folderName,
  estimatedHours,
  dueDate,
}: TaskDetailsMetaSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Details
        </h3>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Assignee</dt>
            <dd className="mt-2">
              {assignees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              ) : (
                <div className="space-y-3">
                  {assignees.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <ProfileAvatar
                        userId={a.id}
                        name={a.full_name}
                        avatarUrl={a.avatar_url}
                        email={a.email}
                        size="md"
                        eager
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{a.full_name}</p>
                        {a.job_title && (
                          <p className="truncate text-xs text-muted-foreground">{a.job_title}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </dd>
          </div>

          {createdBy && (
            <div>
              <dt className="text-xs text-muted-foreground">Created by</dt>
              <dd className="mt-2 flex items-center gap-2.5">
                <ProfileAvatar
                  userId={createdBy.id}
                  name={createdBy.full_name}
                  avatarUrl={createdBy.avatar_url}
                  email={createdBy.email}
                  size="md"
                  eager
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{createdBy.full_name}</p>
                  {createdBy.job_title && (
                    <p className="truncate text-xs text-muted-foreground">{createdBy.job_title}</p>
                  )}
                </div>
              </dd>
            </div>
          )}

          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Time summary
            </dt>
            <dd className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Today: </span>
                <span className="font-medium text-foreground">{formatDurationHuman(todaySeconds)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-medium text-foreground">{formatDurationHuman(totalSeconds)}</span>
              </p>
            </dd>
          </div>

          {folderName && (
            <div>
              <dt className="text-xs text-muted-foreground">Folder</dt>
              <dd className="mt-0.5 font-medium text-foreground">{folderName}</dd>
            </div>
          )}

          {dueDate && (
            <div>
              <dt className="text-xs text-muted-foreground">Due date</dt>
              <dd className="mt-0.5 font-medium text-foreground">{formatDate(dueDate)}</dd>
            </div>
          )}

          {estimatedHours != null && (
            <div>
              <dt className="text-xs text-muted-foreground">Estimated time</dt>
              <dd className="mt-0.5 font-medium text-foreground">{estimatedHours}h</dd>
            </div>
          )}

          {(createdAt || updatedAt) && (
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              {createdAt && <p>Created {formatDate(createdAt)}</p>}
              {updatedAt && <p className="mt-0.5">Updated {formatDate(updatedAt)}</p>}
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
