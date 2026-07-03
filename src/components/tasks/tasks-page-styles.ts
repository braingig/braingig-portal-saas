import { cn } from "@/lib/utils";
import {
  dsDropdownContent,
  dsDropdownItem,
  dsFilterSelectWidth,
  dsInputSm,
  dsProjectStack,
  dsSearchInput,
  dsSelectTriggerClass,
} from "@/lib/design-system";

/** Tasks list page tokens — aligned with task preview modal surfaces */

/** Matches card section headers on My Tasks, Team, Employees */
export const tasksProjectTitle = "text-xs font-semibold leading-snug text-foreground";
export const tasksProjectSummary = "text-[10px] font-normal leading-snug text-muted-foreground/70";
export const tasksFolderTitle = "text-xs font-medium leading-snug text-muted-foreground";
export const tasksListTitle = "text-xs font-normal leading-snug text-foreground";
export const tasksSubListTitle = "text-xs font-normal leading-snug text-muted-foreground/85";
export const tasksTitleInteractive =
  "text-foreground transition-colors duration-150 hover:text-foreground/80";
export const tasksMeta = "text-[10px] font-normal leading-snug text-muted-foreground";
export const tasksSecondary = "text-xs font-normal leading-snug text-muted-foreground";
export const tasksField = cn(tasksSecondary, "text-muted-foreground/70");
export const tasksMuted = cn(tasksMeta, "text-muted-foreground/55");

/** Compact status pill for task list rows */
export const tasksStatusPill =
  "!inline-flex !h-[22px] !min-h-[22px] !items-center !justify-center !rounded-md !border !px-2 !py-0 !text-[10px] !font-medium !leading-none !shadow-none";
export const tasksDropdown = cn(dsDropdownContent, "rounded-[11px] border-border/40");
export const tasksMenuItem = dsDropdownItem;

export const tasksFilterTrigger = cn(
  dsSelectTriggerClass("default"),
  "h-7 px-2.5 text-xs font-medium leading-none",
);
export const tasksFilterTriggerSecondary = cn(
  dsSelectTriggerClass("secondary"),
  "h-7 px-2.5 text-xs font-medium leading-none border-border/30 bg-card shadow-none",
);
export const tasksFilterTriggerTertiary = cn(
  dsSelectTriggerClass("tertiary"),
  "h-7 gap-1.5 px-2.5 text-xs font-medium leading-none border-border/25 bg-card shadow-none",
);
export const tasksFilterSelectContent = "text-xs";
export const tasksFilterSelectItem = "min-h-[28px] py-1 text-xs font-normal leading-snug";
export const tasksFilterWidth = dsFilterSelectWidth;

/** Consistent icon sizing across task list controls */
export const tasksIconSm = "size-3.5";
export const tasksIconMd = "size-4";

export const tasksIconBtn =
  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground/45 opacity-0 transition-all duration-150 hover:bg-surface/60 hover:text-foreground group-hover/header:opacity-100";

export const tasksCollapseBtn =
  "grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground/45 transition-colors duration-150 hover:bg-surface/50 hover:text-foreground";

export const tasksRowHover =
  "transition-colors duration-150 hover:bg-surface/50";

/** Modal-aligned card shell */
export const tasksSectionShell =
  "overflow-hidden rounded-xl border border-border/40 bg-card shadow-none";

export const tasksProjectHeader =
  "group/header border-b border-border/30 bg-card px-5 py-4";

export const tasksProjectBody = "bg-card";

export const tasksFolderBadge = cn(tasksMeta, "tabular-nums text-muted-foreground/45");

export const tasksFolderHeader =
  "group/folder flex items-center gap-1 py-2 pl-9 pr-5 sm:pl-11";

export const tasksFolderBody = "pb-1 pl-11 sm:pl-[3.25rem]";

export const tasksFolderIconBtn =
  "grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground/45 opacity-0 transition-all duration-150 hover:bg-surface/60 hover:text-foreground group-hover/folder:opacity-100";

export const tasksProjectStack = cn(dsProjectStack, "space-y-4");

export const tasksListDivider = "border-border/20";

export function tasksInputClass(extra?: string) {
  return cn(dsInputSm, extra);
}

export function tasksSearchInputClass(extra?: string) {
  return cn(dsSearchInput, "border-border/35 bg-card shadow-none focus:border-border/45", extra);
}
