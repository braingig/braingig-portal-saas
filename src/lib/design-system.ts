import { cn } from "@/lib/utils";

/**
 * Global typography & UI tokens — single source of truth for the entire app.
 * Import from here instead of inventing page-specific font sizes.
 */

// ---- Typography scale ----

/** Page title — 32px / 600 */
export const dsPageTitle = "text-[32px] font-semibold tracking-tight text-foreground";

/** Page subtitle — 13px secondary */
export const dsPageSubtitle = "text-[13px] font-normal leading-snug text-muted-foreground";

/** In-page section title — 22px / 600 */
export const dsSectionTitle = "text-[22px] font-semibold tracking-tight text-foreground";

/** Project title — 18px / 600 */
export const dsProjectTitle = "text-lg font-semibold leading-snug text-foreground";

/** Project summary line — 13px muted */
export const dsProjectSummary = "text-[13px] font-normal leading-snug text-muted-foreground/70";

/** Folder title — 15px / 500 */
export const dsFolderTitle = "text-[15px] font-medium leading-snug text-muted-foreground";

/** Task title — 15px / 500 */
export const dsTaskTitle = "text-[15px] font-medium leading-snug text-foreground";

/** Subtask title — 14px */
export const dsSubtaskTitle = "text-sm font-normal leading-snug text-muted-foreground/85";

/** Body text — 14px */
export const dsBody = "text-sm font-normal leading-snug text-foreground";

/** Control label — matches Button (14px / 500) */
export const dsControlText = "text-sm font-medium leading-none";

/** Menu item — 14px body scale */
export const dsMenuItemText = "text-sm font-normal leading-snug";

/** Secondary text — 13px */
export const dsSecondary = "text-[13px] font-normal leading-snug text-muted-foreground";

/** Metadata — 12px */
export const dsMetadata = "text-xs font-normal leading-snug text-muted-foreground";

/** @deprecated Use dsMetadata */
export const dsCaption = dsMetadata;

/** Form label — 14px / 500 */
export const dsLabel = cn(dsControlText, "text-foreground");

/** Badge text — 12px / 500 */
export const dsBadge = "text-xs font-medium leading-none";

/** KPI / stat labels */
export const dsStatLabel = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** KPI / stat values */
export const dsStatValue = "text-2xl font-semibold leading-none tracking-tight text-foreground";

// ---- Navigation & sidebar ----

export const dsNavGroup =
  "px-2 mb-1 text-xs font-medium uppercase tracking-wider leading-snug text-muted-foreground";

export const dsNavLink = cn(
  "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150",
  dsMenuItemText,
);

export const dsNavLinkActive = "bg-sidebar-accent text-foreground";

export const dsNavLinkInactive =
  "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground";

/** @deprecated Use dsNavLink — kept for compatibility */
export const dsNavItem = dsMenuItemText;

export const dsSidebarTitle = cn(dsBody, "truncate text-foreground");

export const dsSidebarMeta = dsMetadata;

// ---- Buttons ----

export const dsButton =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors";

export const dsButtonPrimary = cn(dsButton, dsControlText, "bg-brand px-3 py-1.5 text-brand-foreground hover:brightness-110");

export const dsButtonGhost = cn(dsButton, dsControlText, "px-2 py-1.5 text-muted-foreground hover:bg-surface hover:text-foreground");

// ---- Dropdowns & menus ----

export const dsDropdownContent =
  "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border/60 bg-popover p-1 text-popover-foreground shadow-md";

export const dsDropdownItem = cn(
  "relative flex min-h-[34px] cursor-pointer select-none items-center gap-2 rounded-sm px-2.5 py-1.5 outline-none transition-colors hover:bg-muted/60 focus:bg-muted/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed [&>svg]:size-4 [&>svg]:shrink-0",
  dsMenuItemText,
);

export const dsDropdownSubTrigger = cn(dsDropdownItem, "data-[state=open]:bg-muted/60");

export const dsDropdownCheckboxItem = cn(
  "relative flex min-h-[34px] cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2.5 outline-none transition-colors hover:bg-muted/60 focus:bg-muted/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  dsMenuItemText,
);

export const dsDropdownLabel = "px-2.5 py-1.5 text-xs font-medium leading-snug text-muted-foreground";

export const dsDropdownShortcut = "ml-auto text-xs tracking-widest text-muted-foreground/60";

// ---- Select / filter triggers ----

/** Standard icon stroke width */
export const dsIconStroke = 1.75;

/** Chevron icon for all select triggers */
export const dsSelectChevron = "size-4 shrink-0 self-center text-muted-foreground/50";

/** Default select trigger — 36px */
export const dsSelectTrigger = cn(
  "flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border/50 bg-card px-3 text-foreground shadow-none outline-none transition-colors focus:ring-1 focus:ring-border/30 focus:border-border/60 disabled:cursor-not-allowed disabled:opacity-50",
  dsControlText,
);

/** Compact select trigger — 32px (toolbars, filters) */
export const dsSelectTriggerSm = cn(
  "flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border/50 bg-card px-3 text-foreground shadow-none outline-none transition-colors focus:ring-1 focus:ring-border/30 focus:border-border/60 disabled:cursor-not-allowed disabled:opacity-50",
  dsControlText,
);

/** @deprecated Use dsSelectTrigger */
export const dsFilterTrigger = dsSelectTrigger;

export const dsFilterSelectWidth = "w-[132px]";

export const dsSelectValue =
  "pointer-events-none flex min-w-0 flex-1 items-center truncate text-left leading-snug";

export const dsSelectItem = cn(
  "relative flex min-h-[34px] w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2.5 pr-8 outline-none focus:bg-muted/60 focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  dsMenuItemText,
);

// ---- Inputs ----

export const dsInput =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm font-normal leading-snug shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export const dsInputSm =
  "flex h-8 w-full rounded-md border border-border/50 bg-card px-3 text-sm font-normal leading-snug shadow-none outline-none transition-colors placeholder:text-sm placeholder:text-muted-foreground/45 focus:border-border/60 focus:ring-1 focus:ring-border/30";

export const dsSearchInput =
  "flex h-8 w-full rounded-md border border-border/40 bg-card px-3 text-sm font-normal leading-snug shadow-none outline-none transition-colors placeholder:text-sm placeholder:text-muted-foreground/45 focus:border-border/50 focus:ring-1 focus:ring-border/20";

// ---- Layout ----

export const dsSectionStack = "space-y-7";
export const dsProjectStack = "space-y-7";

// ---- Helpers ----

export function dsInputClass(extra?: string) {
  return cn(dsSearchInput, extra);
}

export function dsSelectTriggerClass(variant: "default" | "secondary" | "tertiary" = "default", extra?: string) {
  const base = variant === "default" ? dsSelectTrigger : dsSelectTriggerSm;
  const styles = {
    default: "",
    secondary: "border-border/30 bg-card text-foreground/90 shadow-none focus:ring-border/20 focus:border-border/40",
    tertiary:
      "border-border/25 bg-card text-muted-foreground shadow-none hover:bg-surface/40 hover:text-foreground focus:ring-border/20 focus:border-border/35",
  };
  return cn(base, styles[variant], extra);
}
