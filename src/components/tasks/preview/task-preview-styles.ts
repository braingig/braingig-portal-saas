import { cn } from "@/lib/utils";
import {
  dsCaption,
  dsDropdownContent,
  dsDropdownItem,
  dsSecondary,
  dsTaskTitle,
} from "@/lib/design-system";

export const previewMeta = dsCaption;
export const previewFieldValue = dsSecondary;
export const previewListTitle = dsTaskTitle;
/** Subtask row title — matches modal body scale (12px) */
export const previewSubtaskTitle = "text-xs font-normal leading-snug text-foreground/90";
export const previewBody = cn(dsSecondary, "leading-snug [&_p]:text-[13px] [&_p]:leading-snug");
export const previewSectionLabel = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

export const previewDropdown = cn(dsDropdownContent, "min-w-[8rem] rounded-[11px]");

export const previewMenuItem = cn(
  dsDropdownItem,
  "rounded-md px-2.5 py-2 hover:bg-surface/80 focus:bg-surface/80",
);

export const previewMenuItemSelected = "bg-brand/10 font-medium";

export const previewMenuItemDanger =
  "text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10";

export function previewMenuItemClass(selected?: boolean, extra?: string) {
  return cn(previewMenuItem, selected && previewMenuItemSelected, extra);
}

/** Light tooltip used inside the task preview modal */
export const previewHint =
  "z-50 max-w-[180px] rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs font-normal leading-snug text-muted-foreground shadow-sm";

/** Compact status pill for subtask rows in the preview modal */
export const previewStatusPill =
  "!h-[22px] !min-h-[22px] !rounded-md !border !px-2 !py-0 !text-xs !font-normal !leading-none !shadow-none";

/** Metadata row in subtask list */
export const previewSubtaskMeta = cn("gap-4", dsSecondary);

/** Modal task title — matches My Tasks detail modal */
export const previewModalTitle = cn(dsTaskTitle, "leading-tight");

/** Wraps expanded section content inside the task preview modal */
export const previewExpandedPanel = cn(
  dsSecondary,
  "leading-snug text-foreground/90",
  "[&_textarea]:text-[13px] [&_textarea]:leading-snug",
  "[&_button]:text-sm",
  "[&_.text-sm]:text-sm",
  "[&_.text-xs]:text-xs",
);
