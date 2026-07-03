import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EVENT_TYPE_COLORS,
  MANUAL_EVENT_TYPE_LABELS,
  MANUAL_EVENT_TYPES,
  RECURRENCE_OPTIONS,
  REMINDER_OPTIONS,
  VISIBILITY_OPTIONS,
  defaultColorForType,
  type ManualEventType,
} from "@/lib/calendar/constants";
import { canCreateManualEventType } from "@/lib/calendar/permissions";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "@/lib/calendar/queries";
import type { EventFormValues, ProfileOption, ProjectOption } from "@/lib/calendar/types";
import type { AppRole } from "@/lib/users/permissions";
import { toast } from "sonner";

type EventFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  role: AppRole;
  initialValues: EventFormValues;
  eventId?: string | null;
  projects: ProjectOption[];
  profiles: ProfileOption[];
  onSaved: () => void;
};

export function EventFormModal({
  open,
  onOpenChange,
  orgId,
  userId,
  role,
  initialValues,
  eventId,
  projects,
  profiles,
  onSaved,
}: EventFormModalProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(eventId);

  useEffect(() => {
    if (open) setValues(initialValues);
  }, [open, initialValues]);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "eventType") {
        next.color = defaultColorForType(value as ManualEventType);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!canCreateManualEventType(values.eventType, role) && !isEdit) {
      toast.error("You cannot create this event type");
      return;
    }

    setSaving(true);
    const payload = {
      ...values,
      color: values.color || defaultColorForType(values.eventType),
    };

    const result = isEdit && eventId
      ? await updateCalendarEvent(eventId, userId, payload)
      : await createCalendarEvent(orgId, userId, payload);

    setSaving(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Event updated" : "Event created");
    onOpenChange(false);
    onSaved();
  }

  const allowedTypes = MANUAL_EVENT_TYPES.filter(
    (t) => isEdit || canCreateManualEventType(t, role),
  );

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit event" : "Create event"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Event title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Event type</Label>
          <Select value={values.eventType} onValueChange={(v) => set("eventType", v as ManualEventType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[t] }}
                    />
                    {MANUAL_EVENT_TYPE_LABELS[t]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Tasks, milestones, and leave appear automatically from their modules.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="allDay"
            checked={values.allDay}
            onCheckedChange={(v) => set("allDay", Boolean(v))}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="allDay">All day</Label>
            <p className="text-xs text-muted-foreground">
              Use for holidays or events without a specific start/end time.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" type="date" value={values.endDate} onChange={(e) => set("endDate", e.target.value)} required />
          </div>
          {!values.allDay && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input id="startTime" type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input id="endTime" type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={values.description} onChange={(e) => set("description", e.target.value)} rows={2} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="Room, address…" />
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={values.visibility} onValueChange={(v) => set("visibility", v as EventFormValues["visibility"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Project (optional)</Label>
            <Select value={values.projectId ?? "none"} onValueChange={(v) => set("projectId", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Link a meeting or reminder to a project. Milestones still come from the Projects module.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Assigned user</Label>
            <Select value={values.userId ?? "none"} onValueChange={(v) => set("userId", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name ?? "Member"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Recurrence</Label>
            <Select value={values.recurrence} onValueChange={(v) => set("recurrence", v as EventFormValues["recurrence"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {values.recurrence !== "never" && (
            <div className="space-y-2">
              <Label htmlFor="recurrenceEnd">Recurrence ends</Label>
              <Input id="recurrenceEnd" type="date" value={values.recurrenceEndDate} onChange={(e) => set("recurrenceEndDate", e.target.value)} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Participants</Label>
          <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border border-border p-2">
            {profiles.filter((p) => p.id !== userId).map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.participantIds.includes(p.id)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...values.participantIds, p.id]
                      : values.participantIds.filter((id) => id !== p.id);
                    set("participantIds", next);
                  }}
                />
                {p.full_name ?? "Member"}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Reminders</Label>
          <div className="space-y-2">
            {REMINDER_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.reminderOffsets.includes(o.value)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...values.reminderOffsets, o.value]
                      : values.reminderOffsets.filter((x) => x !== o.value);
                    set("reminderOffsets", next);
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      </form>
    </AppModal>
  );
}
