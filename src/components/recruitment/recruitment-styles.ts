import {
  dsCaption,
  dsSectionStack,
  dsSectionTitle,
  dsStatLabel,
} from "@/lib/design-system";

/** Recruitment page layout tokens — aligned with global design system. */
export const RECRUIT_SECTION_STACK = dsSectionStack;
export const RECRUIT_SECTION_TITLE = dsSectionTitle;
export const RECRUIT_CARD_LABEL = dsStatLabel;
export const RECRUIT_CARD_VALUE_SM = "text-xl font-semibold leading-none tracking-tight";
export const RECRUIT_SECONDARY = dsCaption;
export const RECRUIT_DENSE_CARD =
  "rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-sm";
export const RECRUIT_DENSE_CARD_INTERACTIVE =
  "cursor-pointer text-left transition-colors hover:border-brand/30 hover:bg-brand/[0.02]";
export const RECRUIT_LIST_ITEM =
  "flex w-full cursor-pointer items-center gap-3 border-b border-border px-2.5 py-1.5 text-left transition-colors last:border-0 hover:bg-muted/40";
export const RECRUIT_EMPTY_INSET = "px-2.5 py-3 text-center";
export const RECRUIT_SECTION_LINK =
  "group inline-flex items-center gap-0.5 text-xs text-muted-foreground underline-offset-2 transition-colors duration-200 hover:text-brand hover:underline";
export const RECRUIT_COMPACT_CARD =
  "rounded-lg border border-border bg-card px-2.5 py-2 shadow-sm";
