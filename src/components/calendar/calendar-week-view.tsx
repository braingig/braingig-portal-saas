import { addHours, format, isSameDay, setHours, setMinutes } from "date-fns";
import { useCallback, useState } from "react";
import { CalendarEventChip } from "./calendar-event-chip";
import { HOURS, weekDays } from "@/lib/calendar/date-utils";
import { itemsForDay } from "@/lib/calendar/filters";
import type { CalendarItem } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type CalendarWeekViewProps = {
  anchor: Date;
  items: CalendarItem[];
  onSelectItem: (item: CalendarItem) => void;
  onMoveItem?: (item: CalendarItem, start: Date, end: Date) => void;
  onResizeItem?: (item: CalendarItem, end: Date) => void;
};

const HOUR_HEIGHT = 48;

function layoutTimedEvents(dayItems: CalendarItem[]) {
  const timed = dayItems.filter((i) => !i.allDay);
  return timed.map((item) => {
    const startMinutes = item.start.getHours() * 60 + item.start.getMinutes();
    const endMinutes = item.end.getHours() * 60 + item.end.getMinutes();
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
    return { item, top, height };
  });
}

export function CalendarWeekView({
  anchor,
  items,
  onSelectItem,
  onMoveItem,
  onResizeItem,
}: CalendarWeekViewProps) {
  const days = weekDays(anchor);
  const [dragging, setDragging] = useState<CalendarItem | null>(null);

  const handleDrop = useCallback(
    (day: Date, hour: number) => {
      if (!dragging || dragging.readonly || !onMoveItem) return;
      const duration = dragging.end.getTime() - dragging.start.getTime();
      const start = setMinutes(setHours(day, hour), 0);
      const end = new Date(start.getTime() + duration);
      onMoveItem(dragging, start, end);
      setDragging(null);
    },
    [dragging, onMoveItem],
  );

  return (
    <div className="flex max-h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border">
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l border-border px-2 py-2 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">{format(day, "EEE")}</p>
            <p className={cn("text-sm font-semibold", isSameDay(day, new Date()) && "text-brand")}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-surface/30">
        <div className="p-1" />
        {days.map((day) => {
          const allDay = itemsForDay(items, day).filter((i) => i.allDay);
          return (
            <div key={`allday-${day.toISOString()}`} className="min-h-8 space-y-0.5 border-l border-border p-1">
              {allDay.map((item) => (
                <CalendarEventChip key={item.id} item={item} compact onClick={onSelectItem} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="h-12 border-b border-border pr-2 text-right text-[10px] text-muted-foreground">
                {format(setHours(new Date(), h), "h a")}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const layouts = layoutTimedEvents(itemsForDay(items, day));
            return (
              <div key={day.toISOString()} className="relative border-l border-border">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="h-12 border-b border-border/60"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(day, h)}
                  />
                ))}
                {layouts.map(({ item, top, height }) => (
                  <div
                    key={item.id}
                    className="absolute inset-x-1 z-10"
                    style={{ top, height }}
                  >
                    <div
                      className="relative h-full"
                      draggable={!item.readonly}
                      onDragStart={() => setDragging(item)}
                      onDragEnd={() => setDragging(null)}
                    >
                      <CalendarEventChip
                        item={item}
                        className="h-full"
                        onClick={onSelectItem}
                      />
                      {!item.readonly && onResizeItem && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const startY = e.clientY;
                            const origEnd = item.end;
                            const onMove = (ev: MouseEvent) => {
                              const deltaHours = Math.round((ev.clientY - startY) / HOUR_HEIGHT);
                              onResizeItem(item, addHours(origEnd, deltaHours));
                            };
                            const onUp = () => {
                              window.removeEventListener("mousemove", onMove);
                              window.removeEventListener("mouseup", onUp);
                            };
                            window.addEventListener("mousemove", onMove);
                            window.addEventListener("mouseup", onUp);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
