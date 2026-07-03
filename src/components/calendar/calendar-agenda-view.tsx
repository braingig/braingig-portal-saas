import { format, isSameDay } from "date-fns";
import { sortByStart } from "@/lib/calendar/filters";
import { formatEventTime } from "@/lib/calendar/date-utils";
import type { CalendarItem } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type CalendarAgendaViewProps = {
  items: CalendarItem[];
  onSelectItem: (item: CalendarItem) => void;
};

export function CalendarAgendaView({ items, onSelectItem }: CalendarAgendaViewProps) {
  const sorted = sortByStart(items);
  const groups = new Map<string, CalendarItem[]>();

  for (const item of sorted) {
    const key = format(item.start, "yyyy-MM-dd");
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const today = new Date();

  if (sorted.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        No events in this range
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([dateKey, dayItems]) => {
        const day = new Date(`${dateKey}T12:00:00`);
        const isToday = isSameDay(day, today);
        return (
          <div key={dateKey} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className={cn("border-b border-border px-5 py-3", isToday && "bg-brand/10")}>
              <p className="text-sm font-semibold">{format(day, "EEEE, MMMM d")}</p>
              {isToday && <p className="text-xs text-brand">Today</p>}
            </div>
            <div className="divide-y divide-border">
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-surface/50"
                >
                  <div className="w-28 shrink-0 text-xs text-muted-foreground">
                    {formatEventTime(item.start, item.end, item.allDay)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <p className="truncate text-sm font-medium">{item.title}</p>
                    </div>
                    {(item.location || item.projectName) && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[item.projectName, item.location].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
