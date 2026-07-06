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

/** Modal shell — wide split-panel layout */
export const previewModalShell = cn(
  "fixed z-50 flex flex-col overflow-hidden",
  "inset-3 sm:inset-4 md:inset-6",
  "lg:inset-auto lg:left-1/2 lg:top-1/2 lg:h-auto lg:max-h-[min(88vh,44rem)] lg:w-[min(calc(100vw-3rem),72rem)] lg:-translate-x-1/2 lg:-translate-y-1/2",
  "rounded-2xl border border-border/50 bg-card shadow-2xl",
  "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
);

/** Left details column in split modal */
export const previewDetailsPanel = cn(
  "flex w-full flex-col md:w-[min(20rem,36%)] md:shrink-0 md:border-r md:border-border/40",
  "md:max-h-[min(calc(88vh-3.5rem),40.5rem)] md:overflow-y-auto md:overscroll-contain",
);

/** Right workspace column — tabs + content */
export const previewWorkspacePanel = cn(
  "flex min-w-0 flex-1 flex-col bg-surface/15",
  "md:max-h-[min(calc(88vh-3.5rem),40.5rem)] md:overflow-y-auto md:overscroll-contain",
);

/** Tab bar — fixed at top of workspace panel */
export const previewTabList = cn(
  "flex shrink-0 gap-5 overflow-x-auto border-b border-border/50 bg-card/80 px-5 backdrop-blur-sm",
);

export const previewTabTrigger = cn(
  "relative -mb-px shrink-0 cursor-pointer whitespace-nowrap py-3.5 text-[13px] font-medium text-muted-foreground transition-colors",
  "hover:text-foreground",
  "data-[state=active]:text-foreground",
  "data-[state=active]:border-b-2 data-[state=active]:border-brand",
);

/** Large task title in preview modal */
export const previewModalHeading = "text-[22px] font-semibold leading-tight tracking-tight text-foreground";

/** Breadcrumb trail in modal header */
export const previewBreadcrumb = "text-xs font-normal text-muted-foreground/80";

/** Vertical metadata list row — hover applied after previewInteractiveHover is defined */
export const previewMetaListRowBase = "flex min-h-[2.75rem] items-start gap-3 py-2";

/** Label column in metadata list */
export const previewMetaListLabel = cn(
  "flex w-[6.5rem] shrink-0 items-center gap-2 pt-0.5 text-[12px] text-muted-foreground",
);

export const previewMetaListLabelCompact = cn(
  "flex w-[5.5rem] shrink-0 items-center gap-1.5 pt-0.5 text-[12px] text-muted-foreground",
);

/** Tab content area — content-sized; panel scrolls when overflow */
export const previewTabContent = "px-5 pt-4 pb-4 focus:outline-none data-[state=inactive]:hidden";

/** Attachment file card in horizontal strip */
export const previewAttachmentCard = cn(
  "flex w-[9.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-surface/30",
);

/** Comment composer shell in modal */
export const previewCommentBox = cn(
  "rounded-xl border border-border/50 bg-surface/40 p-3",
);

/** Shared hover surface — visible on card in light and dark mode */
export const previewInteractiveHover = cn(
  "transition-colors duration-150",
  "hover:bg-surface-2 dark:hover:bg-surface/70",
);

/** Vertical metadata list row with hover */
export const previewMetaListRow = cn(
  previewMetaListRowBase,
  "rounded-lg px-2 py-1.5 -mx-2",
  previewInteractiveHover,
);

/** Comment card in modal comments tab */
export const previewCommentCard = cn(
  "rounded-lg border border-border/50 bg-card p-3 shadow-sm transition-colors",
  "hover:border-border/70 hover:bg-surface/30",
);

/** Activity list row */
export const previewActivityRow = cn(
  "flex gap-2.5 rounded-lg px-2 py-1.5 -mx-2 transition-colors",
  previewInteractiveHover,
);

/** Segmented filter for activity period */
export const previewSegmentedControl = "inline-flex rounded-lg border border-border/50 bg-surface/40 p-0.5";

export const previewSegmentedButton = cn(
  "rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors",
  "hover:bg-surface/60 hover:text-foreground",
  "data-[active=true]:bg-brand data-[active=true]:text-brand-foreground data-[active=true]:shadow-sm",
);

/** Interactive field row — label + value on one line, ClickUp-style bg hover */
export const previewFieldRow = cn(
  "flex min-h-[2.5rem] items-center gap-3 rounded-lg px-2.5 py-2",
  previewInteractiveHover,
);

/** Task / subtask title control */
export const previewTitleField = cn(
  "rounded-lg px-2.5 py-1.5",
  previewInteractiveHover,
);

/** Compact meta cell (status, assignee, due date on list rows) */
export const previewMetaCell = cn(
  "rounded-md px-1.5 py-0.5",
  previewInteractiveHover,
);

export const previewFieldLabel = "w-[5.5rem] shrink-0 text-[11px] font-medium text-muted-foreground sm:w-[6.25rem]";

/** Popover/dropdown surfaces inside the preview modal */
export const previewPopoverContent = cn(
  "rounded-xl border border-border/50 bg-card p-3 text-foreground shadow-elevated",
);

/** Block sections (description, note, expandables) */
export const previewFieldBlock = cn(
  "rounded-lg px-3 py-2.5 -mx-1",
  previewInteractiveHover,
);

/** Clickable value control inside a meta row — no extra hover (row handles it) */
export const previewFieldValueBtn = "min-w-0 rounded-md px-1 py-0.5 text-left outline-none";

/** Modal task title — matches My Tasks detail modal */
export const previewModalTitle = cn(dsTaskTitle, "leading-tight");

/** Sticky footer for create/edit task modal */
export const previewFormFooter =
  "flex shrink-0 items-center justify-end gap-2 border-t border-border/40 bg-card px-6 py-3";

/** Primary action in form footer */
export const previewFormSubmitBtn =
  "inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

/** Secondary action in form footer */
export const previewFormCancelBtn =
  "inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50";


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
