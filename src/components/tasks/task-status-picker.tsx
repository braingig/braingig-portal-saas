import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTaskStatusMeta, TASK_STATUSES, TASK_STATUS_PILL } from "@/lib/tasks/status";
import { dsMenuItemText, dsMetadata } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type TaskStatusPickerProps = {
  status: string;
  onChange: (status: string) => void;
  className?: string;
};

export function TaskStatusPicker({ status, onChange, className }: TaskStatusPickerProps) {
  const [open, setOpen] = useState(false);
  const meta = getTaskStatusMeta(status);
  const pillClass = TASK_STATUS_PILL[status] ?? TASK_STATUS_PILL.todo;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex cursor-pointer items-center rounded-md border px-2 py-0.5 whitespace-nowrap transition-colors hover:brightness-95",
            dsMetadata,
            pillClass,
            className,
          )}
        >
          {meta.label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto min-w-[140px] p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {TASK_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              if (s.key !== status) onChange(s.key);
              setOpen(false);
            }}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-left transition-colors hover:bg-surface-2",
              dsMenuItemText,
              s.key === status && "bg-surface-2/80 font-medium",
            )}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", s.color)} />
            {s.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
