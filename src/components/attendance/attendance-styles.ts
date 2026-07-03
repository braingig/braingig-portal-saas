import {
  dsBody,
  dsCaption,
  dsSectionStack,
  dsSectionTitle,
  dsSecondary,
  dsStatLabel,
  dsStatValue,
} from "@/lib/design-system";

export const SECTION_TITLE = dsSectionTitle;
export const CARD_TITLE = dsStatLabel;
export const CARD_VALUE = dsStatValue;
export const SECONDARY_TEXT = dsCaption;
export const TABLE_TEXT = dsBody;
export const COMPACT_CARD = "rounded-lg border border-border bg-card px-3 py-2 shadow-sm";
export const INPUT_CLASS = "rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm";
export const SECTION_STACK = dsSectionStack;
export const TABLE_HEAD = "h-8 px-3 text-xs font-medium text-muted-foreground";
export const TABLE_CELL = "px-3 py-1.5 text-sm align-middle";
export const TABLE_ROW = "border-b transition-colors hover:bg-muted/40";
