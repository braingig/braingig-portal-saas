import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
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
  const label = count !== undefined ? `${title} (${count})` : title;

  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {Icon && <Icon className="size-3.5 shrink-0" />}
                {label}
              </h2>
              {!open && hint && (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              )}
            </div>
            <ChevronDown
              className={collapseChevronClass(open, "size-4 shrink-0 text-muted-foreground")}
            />
          </div>
        </button>
        {action && <div className="shrink-0 self-start">{action}</div>}
      </div>

      <AnimatedCollapse open={open} contentClassName="min-h-0">
        <div className="pt-4">{children}</div>
      </AnimatedCollapse>
    </section>
  );
}
