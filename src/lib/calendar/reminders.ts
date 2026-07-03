import { addMinutes } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export async function processDueReminders(orgId: string, userId: string) {
  const now = new Date();

  const { data: reminders } = await supabase
    .from("calendar_event_reminders")
    .select("id, offset_minutes, event_id, calendar_events(id, title, start_at, organization_id)")
    .eq("user_id", userId)
    .is("notified_at", null);

  if (!reminders?.length) return;

  for (const reminder of reminders) {
    const event = reminder.calendar_events as {
      id: string;
      title: string;
      start_at: string;
      organization_id: string;
    } | null;
    if (!event || event.organization_id !== orgId) continue;

    const remindAt = addMinutes(new Date(event.start_at), -reminder.offset_minutes);
    if (remindAt > now) continue;

    const offsetLabel =
      reminder.offset_minutes === 0
        ? "now"
        : reminder.offset_minutes === 1440
          ? "in 1 day"
          : `${reminder.offset_minutes} min before`;

    await supabase.from("notifications").insert({
      user_id: userId,
      organization_id: orgId,
      type: "calendar_reminder",
      title: `Reminder: ${event.title}`,
      body: `Event starts ${offsetLabel}`,
      link: "/calendar",
      entity_type: "calendar_event",
      entity_id: event.id,
    });

    await supabase
      .from("calendar_event_reminders")
      .update({ notified_at: now.toISOString() })
      .eq("id", reminder.id);
  }
}
