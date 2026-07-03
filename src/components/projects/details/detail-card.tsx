import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DetailCard({ title, action, children, className }: DetailCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}
