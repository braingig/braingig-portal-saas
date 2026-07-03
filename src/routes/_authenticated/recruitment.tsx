import { createFileRoute } from "@tanstack/react-router";
import { RecruitmentPageContent } from "@/components/recruitment/recruitment-page";

export const Route = createFileRoute("/_authenticated/recruitment")({
  head: () => ({ meta: [{ title: "Recruitment · WorkPilot" }] }),
  component: RecruitmentPageContent,
});
