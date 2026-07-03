import {
  dsCaption,
  dsSectionStack,
  dsSectionTitle,
  dsStatLabel,
  dsStatValue,
} from "@/lib/design-system";

/** Leave page layout tokens — aligned with global design system. */
export const LEAVE_SECTION_STACK = dsSectionStack;
export const LEAVE_SECTION_TITLE = dsSectionTitle;
export const LEAVE_CARD_LABEL = dsStatLabel;
export const LEAVE_CARD_VALUE = dsStatValue;
export const LEAVE_CARD_VALUE_SM = "text-xl font-semibold leading-none tracking-tight";
export const LEAVE_SECONDARY = dsCaption;
export const LEAVE_DENSE_CARD =
  "rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-sm";
export const LEAVE_DENSE_CARD_INTERACTIVE =
  "cursor-pointer text-left transition-colors hover:border-brand/30 hover:bg-brand/[0.02]";
export const LEAVE_LIST_ITEM =
  "flex w-full cursor-pointer items-center gap-3 border-b border-border px-2.5 py-1.5 text-left transition-colors last:border-0 hover:bg-muted/40";
export const LEAVE_EMPTY_INSET = "px-2.5 py-3 text-center";
export const LEAVE_SECTION_LINK =
  "group inline-flex items-center gap-0.5 text-xs text-muted-foreground underline-offset-2 transition-colors duration-200 hover:text-brand hover:underline";
