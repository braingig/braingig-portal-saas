import type { ReactNode } from "react";
import { Calendar, Clock, Flag, FolderOpen, Hourglass, User, Users } from "lucide-react";
import { DetailCard } from "@/components/projects/details/detail-card";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { TaskActivityFeed } from "@/components/tasks/details/task-activity-feed";
import type { TaskCommentRecord } from "@/lib/tasks/comments";
import { formatDate } from "@/lib/format";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskDetailProfile } from "@/lib/tasks/types";
import type { TaskPreviewAudit } from "@/components/tasks/preview/use-task-preview-data";
import type { TaskTimeEntry } from "@/lib/tasks/types";

type TaskDetailsSidebarProps = {
  assignees: TaskDetailProfile[];
  createdBy: TaskDetailProfile | null;
  folderName: string | null;
  estimatedHours: number | null;
  dueDate: string | null;
  priority: string;
  todaySeconds: number;
  totalSeconds: number;
  createdAt?: string;
  updatedAt?: string;
  timeEntries: TaskTimeEntry[];
  comments: TaskCommentRecord[];
  audits: TaskPreviewAudit[];
  nameOf: (id: string | null | undefined) => string;
  noteSlot?: ReactNode;
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function TaskDetailsSidebar({
  assignees,
  createdBy,
  folderName,
  estimatedHours,
  dueDate,
  priority,
  todaySeconds,
  totalSeconds,
  createdAt,
  updatedAt,
  timeEntries,
  comments,
  audits,
  nameOf,
  noteSlot,
}: TaskDetailsSidebarProps) {
  return (
    <div className="space-y-4">
      <DetailCard title="Details">
        <div className="space-y-4">
          <DetailRow
            icon={Users}
            label="Assignees"
            value={
              assignees.length === 0 ? (
                <span className="font-normal text-muted-foreground">Unassigned</span>
              ) : (
                <div className="space-y-2">
                  {assignees.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <ProfileAvatar
                        userId={a.id}
                        name={a.full_name}
                        avatarUrl={a.avatar_url}
                        email={a.email}
                        size="xs"
                        eager
                      />
                      <span className="truncate text-sm font-medium">{a.full_name}</span>
                    </div>
                  ))}
                </div>
              )
            }
          />

          {createdBy && (
            <DetailRow
              icon={User}
              label="Created by"
              value={createdBy.full_name ?? "Unknown"}
            />
          )}

          <DetailRow
            icon={Calendar}
            label="Due date"
            value={dueDate ? formatDate(dueDate) : <span className="font-normal text-muted-foreground">Not set</span>}
          />

          <DetailRow
            icon={Flag}
            label="Priority"
            value={<span className="capitalize">{priority}</span>}
          />

          {folderName && (
            <DetailRow icon={FolderOpen} label="Folder" value={folderName} />
          )}

          {estimatedHours != null && (
            <DetailRow icon={Hourglass} label="Estimate" value={`${estimatedHours}h`} />
          )}

          <DetailRow
            icon={Clock}
            label="Time logged"
            value={
              <div className="space-y-0.5 text-sm font-medium">
                <p>
                  <span className="font-normal text-muted-foreground">Today: </span>
                  {formatDurationHuman(todaySeconds)}
                </p>
                <p>
                  <span className="font-normal text-muted-foreground">Total: </span>
                  {formatDurationHuman(totalSeconds)}
                </p>
              </div>
            }
          />
        </div>

        {(createdAt || updatedAt) && (
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            {createdAt && <>Created {formatDate(createdAt)}</>}
            {createdAt && updatedAt && " · "}
            {updatedAt && <>Updated {formatDate(updatedAt)}</>}
          </p>
        )}
      </DetailCard>

      <DetailCard title="Activity">
        <TaskActivityFeed
          timeEntries={timeEntries}
          comments={comments}
          audits={audits}
          nameOf={nameOf}
          sortDescending
          showHeader={false}
          previewCount={8}
        />
      </DetailCard>

      {noteSlot && (
        <DetailCard title="Internal note">
          {noteSlot}
        </DetailCard>
      )}
    </div>
  );
}
