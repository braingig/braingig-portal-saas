import { Link } from "@tanstack/react-router";
import { Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  EVENT_TYPE_LABELS,
  isLinkedRecord,
  isManualCalendarEvent,
  LINKED_RECORD_LABELS,
} from "@/lib/calendar/constants";
import { formatEventTime } from "@/lib/calendar/date-utils";
import {
  canDeleteItem,
  canDuplicateItem,
  canEditItem,
} from "@/lib/calendar/permissions";
import type { CalendarItem } from "@/lib/calendar/types";
import type { AppRole } from "@/lib/users/permissions";
import { cn } from "@/lib/utils";

type EventDetailDrawerProps = {
  item: CalendarItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  role: AppRole;
  onEdit: (item: CalendarItem) => void;
  onDuplicate: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function linkedModuleLink(item: CalendarItem): { to: string; label: string; params?: Record<string, string> } | null {
  switch (item.source) {
    case "task":
      return null;
    case "milestone":
      return item.projectId
        ? { to: "/projects/$projectId", params: { projectId: item.projectId }, label: "Open project" }
        : null;
    case "leave":
      return { to: "/leave", label: "Open leave module" };
    default:
      return null;
  }
}

export function EventDetailDrawer({
  item,
  open,
  onOpenChange,
  userId,
  role,
  onEdit,
  onDuplicate,
  onDelete,
}: EventDetailDrawerProps) {
  if (!item) return null;

  const linked = isLinkedRecord(item);
  const manual = isManualCalendarEvent(item);
  const editable = canEditItem(item, userId, role);
  const deletable = canDeleteItem(item, userId, role);
  const duplicatable = canDuplicateItem(item);
  const moduleLink = linkedModuleLink(item);

  const subtitle = linked
    ? LINKED_RECORD_LABELS[item.source as keyof typeof LINKED_RECORD_LABELS]
    : EVENT_TYPE_LABELS[item.eventType];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <div className="flex items-start gap-3 pr-6">
            <span
              className="mt-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0 flex-1">
              {linked && (
                <span className="mb-2 inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Linked record
                </span>
              )}
              <SheetTitle className="text-left">{item.title}</SheetTitle>
              <SheetDescription className="text-left">{subtitle}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {linked && (
          <p className="mt-4 rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
            This item is managed in the {subtitle.toLowerCase()} module. The calendar only displays it.
          </p>
        )}

        <div className="mt-6 space-y-5">
          <DetailRow label="Date & time">
            {formatEventTime(item.start, item.end, item.allDay)}
            <p className="text-xs text-muted-foreground">
              {format(item.start, "EEEE, MMMM d, yyyy")}
              {!item.allDay && item.end.toDateString() !== item.start.toDateString() &&
                ` – ${format(item.end, "EEEE, MMMM d, yyyy")}`}
            </p>
          </DetailRow>

          {item.description && <DetailRow label="Description">{item.description}</DetailRow>}
          {item.location && <DetailRow label="Location">{item.location}</DetailRow>}
          {item.notes && <DetailRow label="Notes">{item.notes}</DetailRow>}
          {item.projectName && <DetailRow label="Project">{item.projectName}</DetailRow>}

          {item.source === "leave" && item.leaveType && (
            <DetailRow label="Leave type">
              <span className="capitalize">{item.leaveType}</span>
            </DetailRow>
          )}
          {item.source === "leave" && item.leaveStatus && (
            <DetailRow label="Status">
              <span className="capitalize">{item.leaveStatus}</span>
            </DetailRow>
          )}

          {item.participantNames.length > 0 && (
            <DetailRow label="Participants">
              <ul className="space-y-2">
                {item.participantNames.map((name, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ProfileAvatar name={name} className="size-6" />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </DetailRow>
          )}

          {item.userName && <DetailRow label="Assigned to">{item.userName}</DetailRow>}
          {manual && item.createdByName && <DetailRow label="Created by">{item.createdByName}</DetailRow>}
          {manual && item.updatedAt && (
            <DetailRow label="Last updated">
              {format(new Date(item.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </DetailRow>
          )}
        </div>

        <div className={cn("mt-8 flex flex-wrap gap-2 border-t border-border pt-4", linked && "justify-start")}>
          {moduleLink && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to={moduleLink.to} params={moduleLink.params}>
                <ExternalLink className="size-3.5" />
                {moduleLink.label}
              </Link>
            </Button>
          )}

          {manual && editable && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(item)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
          {manual && duplicatable && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onDuplicate(item)}>
              <Copy className="size-3.5" /> Duplicate
            </Button>
          )}
          {manual && deletable && (
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => onDelete(item)}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
