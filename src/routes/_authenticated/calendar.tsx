import { createFileRoute } from "@tanstack/react-router";
import { CalendarPageContent } from "@/components/calendar/calendar-page";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar · WorkPilot" }] }),
  component: CalendarPageContent,
});
