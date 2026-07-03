import { AttendanceSectionHeader } from "@/components/attendance/today-summary";
import { AttendanceTimelineList } from "@/components/attendance/timeline";
import { COMPACT_CARD, SECONDARY_TEXT } from "@/components/attendance/attendance-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AttendanceEvent } from "@/lib/attendance/types";

const PREVIEW_COUNT = 4;

function TimelineEmptyState() {
  return (
    <div className="py-4 text-center">
      <p className="text-sm font-medium text-foreground">No attendance activity today.</p>
      <p className={SECONDARY_TEXT}>Clock in to start tracking your workday.</p>
    </div>
  );
}

type PreviewProps = {
  events: AttendanceEvent[];
  onViewAll: () => void;
};

export function TimelinePreview({ events, onViewAll }: PreviewProps) {
  const preview = events.slice(-PREVIEW_COUNT);

  return (
    <section>
      <AttendanceSectionHeader title="Today's Timeline" actionLabel="View Timeline" onAction={onViewAll} />
      <div className={COMPACT_CARD}>
        {preview.length === 0 ? (
          <TimelineEmptyState />
        ) : (
          <>
            <p className={SECONDARY_TEXT}>{events.length} event{events.length === 1 ? "" : "s"}</p>
            <div className="mt-1.5">
              <AttendanceTimelineList events={preview} compact />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: AttendanceEvent[];
};

export function TimelineDrawer({ open, onOpenChange, events }: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base font-semibold">Today&apos;s Timeline</SheetTitle>
          <SheetDescription className="text-xs">Full activity log for today.</SheetDescription>
        </SheetHeader>
        <div className="mt-5">
          {events.length === 0 ? <TimelineEmptyState /> : <AttendanceTimelineList events={events} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
