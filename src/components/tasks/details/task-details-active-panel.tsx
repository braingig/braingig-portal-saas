import { Radio } from "lucide-react";
import { TaskPerson } from "@/components/tasks/details/task-person";
import type { TaskDetailProfile } from "@/lib/tasks/types";

type TaskDetailsActivePanelProps = {
  isTracking: boolean;
  activeUsers: TaskDetailProfile[];
  currentUserId?: string;
};

export function TaskDetailsActivePanel({
  isTracking,
  activeUsers,
  currentUserId,
}: TaskDetailsActivePanelProps) {
  if (!isTracking || activeUsers.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-success">Active now</span>
        </div>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-foreground">
          {activeUsers.length}
        </span>
      </div>
      <div className="space-y-2">
        {activeUsers.map((profile) => (
          <div key={profile.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface/80 px-2 py-1.5">
            <TaskPerson
              profile={profile}
              size="sm"
              showYou
              currentUserId={currentUserId}
            />
            <Radio className="size-3.5 shrink-0 text-success" />
          </div>
        ))}
      </div>
    </div>
  );
}
