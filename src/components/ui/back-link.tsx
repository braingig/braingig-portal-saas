import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type BackLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  className?: string;
};

export function BackLink({ className, children, ...props }: BackLinkProps) {
  return (
    <Link
      className={cn(
        "mt-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      <ArrowLeft className="size-4 shrink-0" />
      {children}
    </Link>
  );
}
