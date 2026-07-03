import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PROJECT_STATUSES } from "@/lib/projects/constants";
import { getProjectStatusMeta } from "@/lib/projects/status";

type ProjectStatusPickerProps = {
  status: string;
  onChange: (status: string) => void;
  className?: string;
  size?: "sm" | "md";
};

export function ProjectStatusPicker({
  status,
  onChange,
  className,
  size = "sm",
}: ProjectStatusPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = getProjectStatusMeta(status);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border font-semibold uppercase tracking-wide transition-colors hover:border-brand/40 hover:bg-surface",
          size === "sm" ? "rounded-full px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
          meta.value === "active" && "border-success/30 bg-success/10 text-success",
          meta.value === "planning" && "border-border bg-surface-2 text-muted-foreground",
          meta.value === "on_hold" && "border-warning/30 bg-warning/10 text-warning",
          meta.value === "completed" && "border-success/30 bg-success/10 text-success",
          meta.value === "cancelled" && "border-danger/30 bg-danger/10 text-danger",
          !["active", "planning", "on_hold", "completed", "cancelled"].includes(meta.value) &&
            "border-border bg-surface-2 text-foreground",
        )}
      >
        {size === "md" ? meta.label.toUpperCase() : meta.label}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 min-w-[130px] pt-1">
          <div className="rounded-md border border-border bg-popover py-1 shadow-lg">
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  if (s.value !== status) onChange(s.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-surface-2",
                  size === "sm" ? "text-[11px]" : "text-xs",
                  s.value === status && "bg-surface-2/80 font-medium",
                )}
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", s.color)} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
