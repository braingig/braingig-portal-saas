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

/** Page section card — matches project DetailCard styling. */
export function TaskDetailsSection({
  title,
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

  const label = count !== undefined ? `${title} (${count})` : title;

  return (
    <section
      id={id}
      className={cn("rounded-xl border border-border bg-card p-5 shadow-soft", className)}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
