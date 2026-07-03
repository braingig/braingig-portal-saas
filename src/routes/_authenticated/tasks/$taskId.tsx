import { createFileRoute } from "@tanstack/react-router";
import { TaskDetailsPageView } from "@/components/tasks/details/task-details-page-view";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  head: ({ params }) => ({ meta: [{ title: `Task · ${params.taskId}` }] }),
  component: TaskDetailsRoute,
});

function TaskDetailsRoute() {
  const { taskId } = Route.useParams();
  return <TaskDetailsPageView taskId={taskId} />;
}
