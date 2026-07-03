import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/calendar/types";
import { format } from "date-fns";

type CalendarEventChipProps = {
  item: CalendarItem;
  compact?: boolean;
  onClick?: (item: CalendarItem) => void;
  draggable?: boolean;
  onDragStart?: (item: CalendarItem, e: React.DragEvent) => void;
  className?: string;
};

export function CalendarEventChip({
  item,
  compact,
  onClick,
  draggable,
  onDragStart,
  className,
}: CalendarEventChipProps) {
  return (
    <button
      type="button"
      draggable={draggable && !item.readonly}
      onDragStart={(e) => onDragStart?.(item, e)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(item);
      }}
      className={cn(
        "group w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight text-white transition-opacity hover:opacity-90",
        item.readonly && "opacity-90 ring-1 ring-white/20",
        className,
      )}
      style={{ backgroundColor: item.color }}
      title={item.title}
    >
      {!compact && !item.allDay && (
        <span className="mr-1 opacity-80">{format(item.start, "h:mm a")}</span>
      )}
      {item.title}
    </button>
  );
}
