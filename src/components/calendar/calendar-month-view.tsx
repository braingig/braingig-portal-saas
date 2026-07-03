import { format, isSameDay, isSameMonth } from "date-fns";
import { CalendarEventChip } from "./calendar-event-chip";
import { itemsForDay } from "@/lib/calendar/filters";
import type { CalendarItem } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
import { monthGridDays } from "@/lib/calendar/date-utils";

type CalendarMonthViewProps = {
  anchor: Date;
  items: CalendarItem[];
  onSelectDay: (day: Date) => void;
  onSelectItem: (item: CalendarItem) => void;
  onCreateOnDay: (day: Date) => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonthView({
  anchor,
  items,
  onSelectDay,
  onSelectItem,
  onCreateOnDay,
}: CalendarMonthViewProps) {
  const days = monthGridDays(anchor);
  const today = new Date();
  const weekCount = Math.ceil(days.length / 7);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-card">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 bg-card"
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(6rem, auto))` }}
      >
        {days.map((day, index) => {
          const dayItems = itemsForDay(items, day).slice(0, 3);
          const overflow = itemsForDay(items, day).length - dayItems.length;
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, today);
          const row = Math.floor(index / 7);
          const col = index % 7;
          const isLastRow = row === weekCount - 1;
          const isLastCol = col === 6;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 border-border p-2",
                !isLastRow && "border-b",
                !isLastCol && "border-r",
                !inMonth && "bg-surface/40",
              )}
              onDoubleClick={() => onCreateOnDay(day)}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "mb-1.5 flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isToday && "bg-brand text-brand-foreground shadow-sm",
                  !isToday && "text-foreground hover:bg-surface",
                  !inMonth && !isToday && "text-muted-foreground",
                )}
              >
                {format(day, "d")}
              </button>
              <div className="space-y-0.5">
                {dayItems.map((item) => (
                  <CalendarEventChip key={item.id} item={item} compact onClick={onSelectItem} />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="px-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
