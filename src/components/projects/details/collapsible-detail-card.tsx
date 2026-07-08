import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { AnimatedCollapse } from "@/components/ui/animated-collapse";
import { projectMeta, projectSectionTitle } from "@/components/projects/details/project-details-styles";
import { cn } from "@/lib/utils";

type CollapsibleDetailCardProps = {
  title: string;
  icon?: LucideIcon;
  count?: number;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

export function CollapsibleDetailCard({
  title,
  icon: Icon,
  count,
  hint,
  action,
  children,
  className,
  defaultOpen = false,
}: CollapsibleDetailCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const label = count !== undefined ? `${title} · ${count}` : title;

  return (
    <section className={cn("overflow-hidden rounded-xl border border-border/40 bg-card", className)}>
      <div className="flex items-center gap-2 px-5 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground/70 transition-transform duration-300 ease-in-out",
              open && "rotate-90",
            )}
          />
          <div className="min-w-0 flex-1">
            <h2 className={cn("flex items-center gap-2", projectSectionTitle)}>
              {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
              {label}
            </h2>
            {!open && hint && (
              <p className={cn("mt-0.5", projectMeta)}>{hint}</p>
            )}
          </div>
        </button>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <AnimatedCollapse open={open} contentClassName="min-h-0">
        <div className="border-t border-border/30 px-5 py-4">{children}</div>
      </AnimatedCollapse>
    </section>
  );
}
