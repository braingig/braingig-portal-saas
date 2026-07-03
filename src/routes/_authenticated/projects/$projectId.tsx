import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailsPageView } from "@/components/projects/details/project-details-page-view";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: ({ params }) => ({ meta: [{ title: `Project · ${params.projectId}` }] }),
  component: ProjectDetailsRoute,
});

function ProjectDetailsRoute() {
  const { projectId } = Route.useParams();
  return <ProjectDetailsPageView projectId={projectId} />;
}
