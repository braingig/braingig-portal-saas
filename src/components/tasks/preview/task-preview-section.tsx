import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { AnimatedCollapse } from "@/components/ui/animated-collapse";
import { TaskPreviewIconButton } from "@/components/tasks/preview/task-preview-icon-button";
import { previewExpandedPanel, previewFieldBlock } from "@/components/tasks/preview/task-preview-styles";
import { cn } from "@/lib/utils";

type SectionAction = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

type TaskPreviewSectionProps = {
  icon: LucideIcon;
  label: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action?: SectionAction;
  children: React.ReactNode;
};

export function TaskPreviewSection({
  icon: Icon,
  label,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  action,
  children,
}: TaskPreviewSectionProps) {
  const [openInternal, setOpenInternal] = useState(defaultOpen);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  function handleAction() {
    setOpen(true);
    if (!action) return;
    // Defer until the section is expanded (collapsed panels use pointer-events-none).
    requestAnimationFrame(() => action.onClick());
  }

  return (
    <div className={previewFieldBlock}>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3 shrink-0 transition-transform duration-200 ease-out",
              open && "rotate-90",
            )}
          />
          <Icon className="size-3 shrink-0" strokeWidth={1.75} />
          <span>{label}</span>
        </button>
        {action && open && (
          <TaskPreviewIconButton
            icon={action.icon}
            label={action.label}
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
          />
        )}
      </div>
      <AnimatedCollapse open={open}>
        <div className={cn("pb-4 pl-7 pt-1", previewExpandedPanel)}>
          {children}
        </div>
      </AnimatedCollapse>
    </div>
  );
}
