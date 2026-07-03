import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

type AppModalSize = keyof typeof SIZE_CLASS;

type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleBadge?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: AppModalSize;
  className?: string;
};

export function AppModal({
  open,
  onOpenChange,
  title,
  titleBadge,
  description,
  children,
  footer,
  size = "lg",
  className,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-auto max-h-[90vh] w-full flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:rounded-xl",
          SIZE_CLASS[size],
          className,
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 pr-12 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
            {titleBadge}
          </div>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[calc(90vh-10.5rem)] overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>

        {footer && (
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-surface/50 px-6 py-4 sm:gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
