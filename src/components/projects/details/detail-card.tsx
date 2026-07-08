import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { projectSectionTitle } from "@/components/projects/details/project-details-styles";

type DetailCardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "plain";
};

export function DetailCard({
  title,
  action,
  children,
  className,
  variant = "default",
}: DetailCardProps) {
  if (variant === "plain") {
    return (
      <section className={cn("space-y-3", className)}>
        {(title || action) && (
          <div className="flex items-center justify-between gap-2">
            {title && <h2 className={projectSectionTitle}>{title}</h2>}
            {action}
          </div>
        )}
        {children}
      </section>
    );
  }

  return (
    <section className={cn("overflow-hidden rounded-xl border border-border/40 bg-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-border/30 px-5 py-3.5">
          {title && <h2 className={projectSectionTitle}>{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn(title || action ? "px-5 py-4" : "p-5")}>{children}</div>
    </section>
  );
}
