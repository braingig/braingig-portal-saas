import { createFileRoute } from "@tanstack/react-router";
import { LeavePageContent } from "@/components/leave/leave-page";

export const Route = createFileRoute("/_authenticated/leave")({
  head: () => ({ meta: [{ title: "Leave · WorkPilot" }] }),
  component: LeavePageContent,
});
