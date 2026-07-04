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

/** Modal shell — near-full viewport with responsive outer margin */
export const previewModalShell = cn(
  "fixed z-50 flex flex-col overflow-hidden",
  "inset-4 sm:inset-5 md:inset-6 lg:inset-8",
  // xl+: fluid centered width — grows on ultra-wide screens, never a tiny column in the middle
  "xl:inset-y-8 xl:left-1/2 xl:right-auto xl:-translate-x-1/2",
  "xl:w-[clamp(20rem,calc(100vw-3rem),88rem)]",
  "2xl:inset-y-10 2xl:w-[clamp(24rem,calc(100vw-5rem),140rem)]",
  "rounded-2xl border border-border/50 bg-card shadow-2xl",
  "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-[0.99] data-[state=open]:zoom-in-[0.99]",
);

/** Interactive field row — label + value on one line, ClickUp-style bg hover */
export const previewFieldRow = cn(
  "flex min-h-[2.5rem] items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-150",
  "hover:bg-muted/55 dark:hover:bg-surface/70",
);

export const previewFieldLabel = "w-[5.5rem] shrink-0 text-[11px] font-medium text-muted-foreground sm:w-[6.25rem]";

/** Popover/dropdown surfaces inside the preview modal */
export const previewPopoverContent = cn(
  "rounded-xl border border-border/50 bg-card p-3 text-foreground shadow-elevated",
);

/** Block sections (description, note, expandables) */
export const previewFieldBlock = cn(
  "rounded-lg px-3 py-2.5 -mx-1 transition-colors duration-150",
  "hover:bg-muted/55 dark:hover:bg-surface/70",
);

/** Clickable value control inside a meta row — no extra hover (row handles it) */
export const previewFieldValueBtn = "min-w-0 rounded-md px-1 py-0.5 text-left outline-none";

/** Modal task title — matches My Tasks detail modal */
export const previewModalTitle = cn(dsTaskTitle, "leading-tight");


/** Wraps expanded section content inside the task preview modal */
export const previewExpandedPanel = cn(
  dsSecondary,
  "text-[13px] leading-snug text-foreground/90",
  "[&_textarea]:text-[13px] [&_textarea]:leading-snug",
  "[&_table]:text-xs",
  "[&_td]:py-1.5",
  "[&_th]:pb-1.5",
);

/** Compact data table inside the task preview modal */
export const previewTimeTable = "w-full text-xs";

/** Table header row in preview time sections */
export const previewTimeTableHead =
  "border-b border-border/30 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

/** Empty state copy in preview time sections */
export const previewTimeEmpty = "text-xs text-muted-foreground";
