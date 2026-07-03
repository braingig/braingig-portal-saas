import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/ui/back-link";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskDetailsActivePanel } from "@/components/tasks/details/task-details-active-panel";
import { TaskDetailsAttachments } from "@/components/tasks/details/task-details-attachments";
import { TaskDetailsComments } from "@/components/tasks/details/task-details-comments";
import { TaskDetailsDescription } from "@/components/tasks/details/task-details-description";
import { TaskDetailsHeader } from "@/components/tasks/details/task-details-header";
import { TaskDetailsLayout } from "@/components/tasks/details/task-details-layout";
import { TaskDetailsSidebar } from "@/components/tasks/details/task-details-sidebar";
import { TaskDetailsSubtasks } from "@/components/tasks/details/task-details-subtasks";
import { TaskDetailsTimeSection } from "@/components/tasks/details/task-details-time-section";
import { useTaskPreviewData } from "@/components/tasks/preview/use-task-preview-data";
import { useDeviceActivity } from "@/hooks/use-device-activity";
import { useRoles } from "@/hooks/use-role";
import { sumTodaySeconds } from "@/lib/tasks/time-aggregates";
import { fetchParentTaskSummary } from "@/lib/tasks/subtasks";
import type { TaskDetailRecord } from "@/lib/tasks/types";

type TaskDetailsPageViewProps = {
  taskId: string;
};

export function TaskDetailsPageView({ taskId }: TaskDetailsPageViewProps) {
  const navigate = useNavigate();
  const { hasAny } = useRoles();
  const [showEditModal, setShowEditModal] = useState(false);
  const [parentTask, setParentTask] = useState<Pick<TaskDetailRecord, "id" | "title"> | null>(null);

  const data = useTaskPreviewData(taskId, true);

  useDeviceActivity(data.task?.project_id || null, data.task?.id || null);

  useEffect(() => {
    if (!data.task?.parent_id) {
      setParentTask(null);
      return;
    }
    void fetchParentTaskSummary(data.task.parent_id).then((summary) => {
      setParentTask(summary ? { id: summary.id, title: summary.title } : null);
    });
  }, [data.task?.parent_id]);

  const todaySeconds = useMemo(
    () => sumTodaySeconds(data.timeEntries, data.isTracking ? data.sessionTime : 0),
    [data.timeEntries, data.isTracking, data.sessionTime],
  );

  const createdBy = useMemo(
    () => data.profiles.find((p) => p.id === data.task?.created_by) ?? null,
    [data.profiles, data.task?.created_by],
  );

  const activeNowUsers = data.isTracking && data.user
    ? (() => {
      const profile = data.profiles.find((p) => p.id === data.user?.id);
      return profile
        ? [profile]
        : [{
          id: data.user.id,
          full_name: "You",
          avatar_url: null,
          email: data.user.email ?? null,
          job_title: null,
        }];
    })()
    : [];

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const ok = await data.deleteTask();
    if (!ok || !data.task) return;
    if (data.task.parent_id) {
      navigate({ to: "/tasks/$taskId", params: { taskId: data.task.parent_id } });
    } else {
      navigate({ to: "/tasks" });
    }
  }

  if (data.loading || !data.task) {
    return (
      <AppShell>
        <BackLink to="/tasks" className="mb-4">Back to tasks</BackLink>
        <div className="text-sm text-muted-foreground">Loading task…</div>
      </AppShell>
    );
  }

  const assigneeIds = data.assignees.map((a) => a.id);

  return (
    <AppShell>
      <TaskDetailsLayout
        header={(
          <TaskDetailsHeader
            task={data.task}
            projectName={data.projectName}
            folderName={data.folderName}
            parentTask={parentTask}
            onEdit={() => setShowEditModal(true)}
            onDelete={() => void handleDelete()}
            onStatusChange={(s) => void data.patchTask({ status: s })}
            canDelete={data.user?.id === data.task.created_by}
          />
        )}
        main={(
          <>
            <TaskDetailsDescription
              description={data.task.description}
              members={data.mentionMembers}
              onDescriptionChange={data.saveDescription}
              descriptionOnly
            />

            {!data.task.parent_id && data.user && data.orgId && (
              <TaskDetailsSubtasks
                parentTask={data.task}
                subtasks={data.subtasks}
                orgId={data.orgId}
                userId={data.user.id}
                onChange={data.loadData}
                onOpenTask={(id) => navigate({ to: "/tasks/$taskId", params: { taskId: id } })}
              />
            )}

            <TaskDetailsComments
              comments={data.comments}
              members={data.mentionMembers}
              currentUserId={data.user?.id}
              canModerate={hasAny("owner", "admin")}
              onSubmit={data.postComment}
              onUpdate={data.updateComment}
              onDelete={data.removeComment}
            />

            {data.orgId && (
              <TaskDetailsAttachments
                orgId={data.orgId}
                taskId={data.task.id}
                refreshKey={data.attachmentCount}
              />
            )}

            <TaskDetailsTimeSection
              taskId={data.task.id}
              timeEntries={data.timeEntries}
              profiles={data.profiles}
              assigneeIds={assigneeIds}
              trackedTotal={data.trackedTotal}
              isTracking={data.isTracking}
              sessionTime={data.sessionTime}
              isAssignee={data.isAssignee}
              currentUserId={data.user?.id}
              onToggleTimer={data.toggleTimer}
            />
          </>
        )}
        sidebar={(
          <TaskDetailsSidebar
            assignees={data.assignees}
            createdBy={createdBy}
            folderName={data.folderName}
            estimatedHours={data.task.estimated_hours}
            dueDate={data.task.due_date}
            priority={data.task.priority}
            todaySeconds={todaySeconds}
            totalSeconds={data.trackedTotal}
            createdAt={data.task.created_at}
            updatedAt={data.task.updated_at}
            timeEntries={data.timeEntries}
            comments={data.flatComments}
            audits={data.audits}
            nameOf={data.nameOf}
            noteSlot={(
              <TaskDetailsDescription
                note={data.task.note}
                description={null}
                members={data.mentionMembers}
                onDescriptionChange={async () => {}}
                onNoteChange={data.saveNote}
                bare
                noteOnly
              />
            )}
          />
        )}
      />

      <TaskDetailsActivePanel
        isTracking={data.isTracking}
        activeUsers={activeNowUsers}
        currentUserId={data.user?.id}
      />

      {data.user && data.orgId && (
        <EditTaskModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          orgId={data.orgId}
          userId={data.user.id}
          taskId={data.task.id}
          onSuccess={data.loadData}
        />
      )}
    </AppShell>
  );
}
