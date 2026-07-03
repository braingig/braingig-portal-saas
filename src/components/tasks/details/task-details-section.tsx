import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskDetailsSectionProps = {
  title: string;
  icon?: LucideIcon;
  count?: number;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  bare?: boolean;
};

export function TaskDetailsSection({
  title,
  icon: Icon,
  count,
  description,
  actions,
  children,
  className,
  id,
  bare = false,
}: TaskDetailsSectionProps) {
  if (bare) {
    return <div className={className}>{children}</div>;
  }

  return (
    <section
      id={id}
      className={cn("rounded-xl border border-border bg-card shadow-sm", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
            {Icon && <Icon className="size-4 shrink-0 text-brand" />}
            {title}
            {count !== undefined && (
              <span className="text-muted-foreground">({count})</span>
            )}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="overflow-visible p-5">{children}</div>
    </section>
  );
}
