import { ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import { QuickTaskAddRow } from "@/components/tasks/quick-task-add-row";
import { tasksIconBtn, tasksMeta, tasksSecondary } from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TasksEmptyStateProps = {
  filtered?: boolean;
  quickAdd?: {
    orgId: string;
    userId: string;
    members: TaskOrgMember[];
    onCreated: () => void;
  };
};

export function TasksEmptyState({ filtered, quickAdd }: TasksEmptyStateProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="rounded-xl border border-dashed border-border/35 bg-card/50 px-5 py-10 text-center">
      <ListTodo className="mx-auto mb-2 size-4 text-muted-foreground/50" strokeWidth={dsIconStroke} />
      <p className={tasksSecondary}>
        {filtered ? "No matching tasks" : "No tasks yet"}
      </p>
      <p className={cn("mx-auto mt-1 max-w-sm", tasksMeta)}>
        {filtered ? "Try different filters or search terms." : "Create your first task to get started."}
      </p>
      {!filtered && quickAdd && !showQuickAdd && (
        <button
          type="button"
          onClick={() => setShowQuickAdd(true)}
          className={cn(tasksIconBtn, "mx-auto mt-3 inline-grid")}
          aria-label="Create task"
        >
          <Plus className="size-4" strokeWidth={dsIconStroke} />
        </button>
      )}
      {!filtered && quickAdd && showQuickAdd && (
        <div className="mx-auto mt-4 max-w-2xl text-left">
          <QuickTaskAddRow
            orgId={quickAdd.orgId}
            userId={quickAdd.userId}
            members={quickAdd.members}
            onSuccess={() => {
              setShowQuickAdd(false);
              quickAdd.onCreated();
            }}
            onCancel={() => setShowQuickAdd(false)}
          />
        </div>
      )}
    </div>
  );
}
