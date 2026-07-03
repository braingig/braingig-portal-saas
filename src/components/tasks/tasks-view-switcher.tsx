import { LayoutGrid, List } from "lucide-react";
import { dsIconStroke } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export type TasksViewMode = "list" | "board";

type TasksViewSwitcherProps = {
  value: TasksViewMode;
  onChange: (value: TasksViewMode) => void;
};

export function TasksViewSwitcher({ value, onChange }: TasksViewSwitcherProps) {
  return (
    <div className="inline-flex h-8 items-center rounded-md border border-border/40 bg-card p-0.5 shadow-none">
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        className={cn(
          "grid size-6 place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:text-foreground",
          value === "list" && "bg-surface/80 text-foreground",
        )}
      >
        <List className="size-4" strokeWidth={dsIconStroke} />
      </button>
      <button
        type="button"
        onClick={() => onChange("board")}
        aria-label="Board view"
        aria-pressed={value === "board"}
        className={cn(
          "grid size-6 place-items-center rounded text-muted-foreground/60 transition-colors duration-150 hover:text-foreground",
          value === "board" && "bg-surface/80 text-foreground",
        )}
      >
        <LayoutGrid className="size-4" strokeWidth={dsIconStroke} />
      </button>
    </div>
  );
}
