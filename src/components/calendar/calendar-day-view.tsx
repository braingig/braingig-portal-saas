import { addHours, format, isSameDay, setHours, setMinutes } from "date-fns";
import { useCallback, useState } from "react";
import { CalendarEventChip } from "./calendar-event-chip";
import { HOURS } from "@/lib/calendar/date-utils";
import { itemsForDay } from "@/lib/calendar/filters";
import type { CalendarItem } from "@/lib/calendar/types";
import { dsSectionTitle, dsStatLabel } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type CalendarDayViewProps = {
  anchor: Date;
  items: CalendarItem[];
  onSelectItem: (item: CalendarItem) => void;
  onMoveItem?: (item: CalendarItem, start: Date, end: Date) => void;
  onResizeItem?: (item: CalendarItem, end: Date) => void;
};

const HOUR_HEIGHT = 56;

export function CalendarDayView({
  anchor,
  items,
  onSelectItem,
  onMoveItem,
  onResizeItem,
}: CalendarDayViewProps) {
  const dayItems = itemsForDay(items, anchor);
  const allDay = dayItems.filter((i) => i.allDay);
  const timed = dayItems.filter((i) => !i.allDay);
  const [dragging, setDragging] = useState<CalendarItem | null>(null);

  const handleDrop = useCallback(
    (hour: number) => {
      if (!dragging || dragging.readonly || !onMoveItem) return;
      const duration = dragging.end.getTime() - dragging.start.getTime();
      const start = setMinutes(setHours(anchor, hour), 0);
      const end = new Date(start.getTime() + duration);
      onMoveItem(dragging, start, end);
      setDragging(null);
    },
    [anchor, dragging, onMoveItem],
  );

  return (
    <div className="flex max-h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <p className={dsStatLabel}>{format(anchor, "EEEE")}</p>
        <p className={cn(dsSectionTitle, isSameDay(anchor, new Date()) && "text-brand")}>
          {format(anchor, "MMMM d, yyyy")}
        </p>
      </div>

      {allDay.length > 0 && (
        <div className="space-y-1 border-b border-border bg-surface/30 p-2">
          <p className={dsStatLabel}>All day</p>
          {allDay.map((item) => (
            <CalendarEventChip key={item.id} item={item} onClick={onSelectItem} />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[56px_1fr]">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="h-14 border-b border-border pr-2 text-right text-[10px] text-muted-foreground">
                {format(setHours(new Date(), h), "h a")}
              </div>
            ))}
          </div>
          <div className="relative border-l border-border">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-14 border-b border-border/60"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(h)}
              />
            ))}
            {timed.map((item) => {
              const startMinutes = item.start.getHours() * 60 + item.start.getMinutes();
              const endMinutes = item.end.getHours() * 60 + item.end.getMinutes();
              const top = (startMinutes / 60) * HOUR_HEIGHT;
              const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
              return (
                <div key={item.id} className="absolute inset-x-2 z-10" style={{ top, height }}>
                  <div
                    className="relative h-full"
                    draggable={!item.readonly}
                    onDragStart={() => setDragging(item)}
                    onDragEnd={() => setDragging(null)}
                  >
                    <CalendarEventChip item={item} className="h-full" onClick={onSelectItem} />
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
