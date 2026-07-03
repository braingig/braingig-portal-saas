import { LayoutGrid } from "lucide-react";
import { tasksMeta } from "@/components/tasks/tasks-page-styles";
import { cn } from "@/lib/utils";

export function TasksBoardPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-card/50 px-6 py-14 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-surface text-muted-foreground">
        <LayoutGrid className="size-4" strokeWidth={1.75} />
      </div>
      <p className="text-xs font-medium text-foreground">Board view</p>
      <p className={cn("mx-auto mt-1.5 max-w-sm", tasksMeta)}>
        Kanban board view is coming soon. Use list view to manage tasks for now.
      </p>
    </div>
  );
}
