import { createFileRoute } from "@tanstack/react-router";
import { AttendancePageContent } from "@/components/attendance/attendance-page";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [{ title: "Attendance · WorkPilot" }] }),
  component: AttendancePageContent,
});
