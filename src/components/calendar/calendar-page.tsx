import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view";
import { CalendarDayView } from "@/components/calendar/calendar-day-view";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { EventDetailDrawer } from "@/components/calendar/event-detail-drawer";
import { EventFormModal } from "@/components/calendar/event-form-modal";
import { TaskPreviewModal } from "@/components/tasks/preview/task-preview-modal";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import type { CalendarView, ManualEventType } from "@/lib/calendar/constants";
import { getViewRange, navigateDate } from "@/lib/calendar/date-utils";
import { applyCalendarFilters, defaultFilters } from "@/lib/calendar/filters";
import {
  defaultFormValues,
  deleteCalendarEvent,
  duplicateCalendarEvent,
  fetchCalendarData,
  loadEventDetail,
  moveCalendarEvent,
} from "@/lib/calendar/queries";
import { processDueReminders } from "@/lib/calendar/reminders";
import type { CalendarFilters, CalendarItem, EventFormValues } from "@/lib/calendar/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CalendarPageContent() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { primary: role } = useRoles();

  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [filters, setFilters] = useState<CalendarFilters>(defaultFilters());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<EventFormValues>(defaultFormValues());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);

  const range = useMemo(() => getViewRange(view, anchor), [view, anchor]);
  const rangeKey = `${range.start.getTime()}-${range.end.getTime()}`;

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { start, end } = getViewRange(view, anchor);
      const data = await fetchCalendarData(orgId, start, end);
      setItems(data.items);
      setProfiles(data.profiles);
      setProjects(data.projects);
    } catch (err) {
      console.error("Calendar load failed:", err);
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [orgId, view, anchor, rangeKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!orgId || !user) return;
    processDueReminders(orgId, user.id);
    const interval = setInterval(() => processDueReminders(orgId, user.id), 60_000);
    return () => clearInterval(interval);
  }, [orgId, user]);

  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`calendar-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events", filter: `organization_id=eq.${orgId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests", filter: `organization_id=eq.${orgId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, load]);

  const filteredItems = useMemo(() => applyCalendarFilters(items, filters), [items, filters]);

  function handleSelectItem(item: CalendarItem) {
    if (item.source === "task") {
      setPreviewTaskId(item.sourceId);
      return;
    }
    setSelectedItem(item);
    setDetailOpen(true);
  }

  function openCreate(type: ManualEventType, date = anchor) {
    setEditingEventId(null);
    setFormValues(defaultFormValues(date, type));
    setFormOpen(true);
  }

  async function handleEdit(item: CalendarItem) {
    if (item.source !== "event") return;
    const detail = await loadEventDetail(item.sourceId, user!.id);
    if (!detail) {
      toast.error("Event not found");
      return;
    }
    setEditingEventId(item.sourceId);
    setFormValues(detail.formValues);
    setDetailOpen(false);
    setFormOpen(true);
  }

  async function handleDuplicate(item: CalendarItem) {
    if (!user) return;
    const { error } = await duplicateCalendarEvent(item.sourceId, user.id);
    if (error) toast.error(error);
    else {
      toast.success("Event duplicated");
      load();
    }
  }

  async function handleDelete(item: CalendarItem) {
    if (!confirm("Delete this event?")) return;
    const { error } = await deleteCalendarEvent(item.sourceId);
    if (error) toast.error(error);
    else {
      toast.success("Event deleted");
      setDetailOpen(false);
      load();
    }
  }

  async function handleMove(item: CalendarItem, start: Date, end: Date) {
    const { error } = await moveCalendarEvent(item.sourceId, start, end, item.allDay);
    if (error) toast.error(error);
    else load();
  }

  async function handleResize(item: CalendarItem, end: Date) {
    const { error } = await moveCalendarEvent(item.sourceId, item.start, end, item.allDay);
    if (error) toast.error(error);
    else load();
  }

  if (!orgId || !user) {
    return (
      <AppShell title="Calendar">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Calendar" subtitle="Your schedule, deadlines, and team timeline">
      <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-6">
        <CalendarSidebar
          selectedDate={anchor}
          filters={filters}
          role={role}
          onDateSelect={(d) => {
            setAnchor(d);
            if (view === "month") setView("day");
          }}
          onFiltersChange={setFilters}
          onQuickCreate={openCreate}
        />

        <div className="min-w-0 flex-1 space-y-5">
          <CalendarToolbar
            view={view}
            anchor={anchor}
            filters={filters}
            projects={projects}
            profiles={profiles}
            showFilters
            onViewChange={setView}
            onNavigate={(dir) => setAnchor((a) => navigateDate(view, a, dir))}
            onToday={() => setAnchor(new Date())}
            onFiltersChange={setFilters}
          />

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
              Loading calendar…
            </div>
          ) : (
            <>
              {view === "month" && (
                <CalendarMonthView
                  anchor={anchor}
                  items={filteredItems}
                  onSelectDay={(d) => {
                    setAnchor(d);
                    setView("day");
                  }}
                  onSelectItem={handleSelectItem}
                  onCreateOnDay={(d) => openCreate("meeting", d)}
                />
              )}
              {view === "week" && (
                <CalendarWeekView
                  anchor={anchor}
                  items={filteredItems}
                  onSelectItem={handleSelectItem}
                  onMoveItem={handleMove}
                  onResizeItem={handleResize}
                />
              )}
              {view === "day" && (
                <CalendarDayView
                  anchor={anchor}
                  items={filteredItems}
                  onSelectItem={handleSelectItem}
                  onMoveItem={handleMove}
                  onResizeItem={handleResize}
                />
              )}
              {view === "agenda" && (
                <CalendarAgendaView items={filteredItems} onSelectItem={handleSelectItem} />
              )}
            </>
          )}
        </div>
      </div>

      <EventDetailDrawer
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        userId={user.id}
        role={role}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <EventFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        orgId={orgId}
        userId={user.id}
        role={role}
        initialValues={formValues}
        eventId={editingEventId}
        projects={projects}
        profiles={profiles}
        onSaved={load}
      />

      <TaskPreviewModal
        taskId={previewTaskId}
        open={Boolean(previewTaskId)}
        onOpenChange={(open) => { if (!open) setPreviewTaskId(null); }}
        onTaskChange={setPreviewTaskId}
        onUpdated={load}
      />
    </AppShell>
  );
}
