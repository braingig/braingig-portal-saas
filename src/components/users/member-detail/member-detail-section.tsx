import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MemberDetailSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function MemberDetailSection({ title, children, className }: MemberDetailSectionProps) {
  return (
    <section className={cn("border-b border-border px-5 py-4 last:border-b-0", className)}>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

type DetailFieldProps = {
  label: string;
  value: ReactNode;
};

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
