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

/** Modal shell — centered dialog (create/edit task forms) */
export const previewModalShell = cn(
  "fixed z-50 flex flex-col overflow-hidden",
  "inset-3 sm:inset-4 md:inset-6",
  "lg:inset-auto lg:left-1/2 lg:top-1/2 lg:h-auto lg:max-h-[min(92vh,52rem)] lg:w-[min(calc(100vw-3rem),56rem)] lg:-translate-x-1/2 lg:-translate-y-1/2",
  "rounded-2xl border border-border/50 bg-card shadow-2xl",
  "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
);

/** ClickUp task sidebar width (fixed on tablet & desktop) */
export const PREVIEW_SIDEBAR_WIDTH = "573px";

/** Task preview overlay — stronger dim on phones (full-screen sheet) */
export const previewSidebarOverlay = cn(
  "bg-black/55 backdrop-blur-[2px]",
  "md:bg-black/40",
);

/**
 * Task preview sidebar — ClickUp-style responsive behavior:
 * - Phones & sm (< md): full-screen sheet
 * - md and up: fixed 573px right panel (ClickUp default width)
 */
export const previewSidebarShell = cn(
  "fixed z-50 flex h-svh flex-col overflow-hidden bg-card shadow-2xl outline-none",
  // Phones & sm: full-screen
  "inset-0 w-full border-0",
  // md+: fixed 573px sidebar docked to the right
  "md:inset-y-0 md:right-0 md:left-auto",
  "md:w-[573px] md:max-w-full",
  "md:border-l md:border-border/50",
  "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
);

/** Scrollable sidebar body — scroll works, scrollbar hidden (ClickUp-style) */
export const previewSidebarScroll = cn(
  "min-h-0 flex-1 overflow-y-auto overscroll-contain",
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
);

/** Hide scrollbar on overflow containers inside task preview */
export const previewScrollHidden = cn(
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
);

/** Top details section in single-column modal */
export const previewDetailsPanel = cn(
  "shrink-0",
);

/** Bottom workspace — tabs + tab content */
export const previewWorkspacePanel = cn(
  "flex min-h-0 flex-1 flex-col bg-surface/10",
);

/** Tab bar — sticky while sidebar scrolls */
export const previewTabList = cn(
  "sticky top-0 z-10 flex shrink-0 gap-5 overflow-x-auto border-b border-border/50 bg-card px-5",
  previewScrollHidden,
);

export const previewTabTrigger = cn(
  "relative -mb-px shrink-0 cursor-pointer whitespace-nowrap py-3 text-[13px] font-medium text-muted-foreground transition-colors",
  "hover:text-foreground",
  "data-[state=active]:text-foreground",
  "data-[state=active]:border-b-2 data-[state=active]:border-brand",
);

/** Large task title in preview modal — ClickUp-style */
export const previewModalHeading = "text-[1.625rem] font-semibold leading-snug tracking-tight text-foreground";

/** ClickUp v4 task fields container */
export const previewClickupFieldsContainer = "flex flex-col";

/** ClickUp v4 metadata row — fixed label column + value */
export const previewClickupMetaRow = cn(
  "grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-2",
  "min-h-8 py-0.5",
);

/** Icon + label in metadata row */
export const previewClickupMetaLabel = "flex items-center gap-1.5 text-[12px] leading-none text-muted-foreground/75";

/** Value column in metadata row */
export const previewClickupRowValue = "flex min-w-0 items-center";

/** Muted empty placeholder (ClickUp "Empty") */
export const previewClickupEmpty = cn(
  "cursor-pointer text-[13px] text-muted-foreground/50 transition-colors hover:text-muted-foreground/70",
);

/** ClickUp date placeholder buttons (Start / Due) */
export const previewClickupDateBtn = cn(
  "inline-flex items-center gap-1 rounded px-0.5 py-0.5 text-[13px] transition-colors hover:bg-surface/70",
);

/** ClickUp status badge group */
export const previewClickupStatusGroup = "inline-flex items-center gap-1.5";

export const previewClickupStatusBadge = cn(
  "inline-flex items-stretch overflow-hidden rounded-md border text-[12px] leading-none",
);

export const previewClickupStatusLabel = "inline-flex items-center px-2.5 py-1.5 lowercase";

export const previewClickupStatusNext = cn(
  "inline-flex items-center border-l border-border/50 px-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
);

export const previewClickupStatusCheck = cn(
  "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-surface",
);

/** ClickUp track-time control */
export const previewClickupTrackTime = "inline-flex items-center gap-2 text-[13px] text-foreground";

export const previewClickupTrackTimePlay = "grid size-5 place-items-center rounded-full bg-muted/50";

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

/** Tab content — flows in sidebar scroll (no inner scroll trap) */
export const previewTabContent = "px-5 pt-4 pb-6 focus:outline-none data-[state=inactive]:hidden";

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
