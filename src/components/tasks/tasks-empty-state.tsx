import { ListTodo, Plus } from "lucide-react";
import { tasksIconBtn, tasksMeta, tasksSecondary } from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type TasksEmptyStateProps = {
  onCreateTask: () => void;
  filtered?: boolean;
};

export function TasksEmptyState({ onCreateTask, filtered }: TasksEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/35 bg-card/50 px-5 py-10 text-center">
      <ListTodo className="mx-auto mb-2 size-4 text-muted-foreground/50" strokeWidth={dsIconStroke} />
      <p className={tasksSecondary}>
        {filtered ? "No matching tasks" : "No tasks yet"}
      </p>
      <p className={cn("mx-auto mt-1 max-w-sm", tasksMeta)}>
        {filtered ? "Try different filters or search terms." : "Create your first task to get started."}
      </p>
      {!filtered && (
        <button type="button" onClick={onCreateTask} className={cn(tasksIconBtn, "mx-auto mt-3 inline-grid")} aria-label="Create task">
          <Plus className="size-4" strokeWidth={dsIconStroke} />
        </button>
      )}
    </div>
  );
}
