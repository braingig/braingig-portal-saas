import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import { useDeviceActivity } from "@/hooks/use-device-activity";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/ui/back-link";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskDetailsAttachments } from "@/components/tasks/details/task-details-attachments";
import { TaskDetailsActivePanel } from "@/components/tasks/details/task-details-active-panel";
import { TaskDetailsComments } from "@/components/tasks/details/task-details-comments";
import { TaskDetailsDailyTotals } from "@/components/tasks/details/task-details-daily-totals";
import { TaskDetailsDescription } from "@/components/tasks/details/task-details-description";
import { TaskDetailsHeader } from "@/components/tasks/details/task-details-header";
import { TaskDetailsMetaSidebar } from "@/components/tasks/details/task-details-sidebar";
import { TaskDetailsSubtasks } from "@/components/tasks/details/task-details-subtasks";
import { TaskDetailsTimeCard } from "@/components/tasks/details/task-details-time-card";
import { TaskDetailsTimeEntries } from "@/components/tasks/details/task-details-time-entries";
import { TaskDetailsWorkers } from "@/components/tasks/details/task-details-workers";
import { fetchProfilesByIds, fetchMentionableMembers } from "@/lib/tasks/org-members";
import { fetchProfileEmails } from "@/lib/profile-emails";
import { extractMentionIdsFromHtml } from "@/lib/tasks/comment-mentions";
import {
  buildCommentTree,
  createTaskComment,
  deleteTaskComment,
  fetchTaskComments,
  updateTaskComment,
  type TaskCommentNode,
} from "@/lib/tasks/comments";
import { notifyTaskMentions } from "@/lib/tasks/mention-notifications";
import {
  buildDailyTotals,
  buildWorkerRows,
  getTodayEntries,
  sumTodaySeconds,
} from "@/lib/tasks/time-aggregates";
import type {
  TaskDetailProfile,
  TaskDetailRecord,
  TaskListItem,
  TaskOrgMember,
  TaskTimeEntry,
  TaskTimeEntryRow,
} from "@/lib/tasks/types";
import { fetchParentTaskSummary, fetchSubtaskListItems } from "@/lib/tasks/subtasks";
import {
  getActiveTaskTimer,
  getTimerElapsedSeconds,
  setActiveTaskTimer,
  subscribeTaskTimer,
} from "@/lib/task-timer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  head: ({ params }) => ({ meta: [{ title: `Task · ${params.taskId}` }] }),
  component: TaskDetailsPage,
});

type Task = TaskDetailRecord;

function profilesMap(list: TaskDetailProfile[]) {
  return new Map(list.map((p) => [p.id, p]));
}

function TaskDetailsPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { hasAny } = useRoles();

  const [task, setTask] = useState<Task | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [parentTask, setParentTask] = useState<Pick<TaskDetailRecord, "id" | "title"> | null>(null);
  const [subtasks, setSubtasks] = useState<TaskListItem[]>([]);
  const [comments, setComments] = useState<TaskCommentNode[]>([]);
  const [mentionMembers, setMentionMembers] = useState<TaskOrgMember[]>([]);
  const [assignees, setAssignees] = useState<TaskDetailProfile[]>([]);
  const [createdBy, setCreatedBy] = useState<TaskDetailProfile | null>(null);
  const [timeEntries, setTimeEntries] = useState<TaskTimeEntry[]>([]);
  const [profiles, setProfiles] = useState<TaskDetailProfile[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  const savedDescription = useRef<string>("");
  const savedNote = useRef<string>("");

  useDeviceActivity(task?.project_id || null, task?.id || null);

  const syncTimerState = useCallback(() => {
    if (!taskId) return;
    const active = getActiveTaskTimer();
    if (active?.taskId === taskId) {
      setIsTracking(true);
      setSessionTime(getTimerElapsedSeconds(active));
    } else {
      setIsTracking(false);
      setSessionTime(0);
    }
  }, [taskId]);

  const loadData = useCallback(async () => {
    if (!taskId || !orgId) return;

    const { data: t } = await supabase.from("tasks").select("*").eq("id", taskId).single();
    if (!t) return;

    const [projectRes, folderRes, subtaskRows, assigns, times, commentRows, members, parentSummary] = await Promise.all([
      t.project_id
        ? supabase.from("projects").select("name").eq("id", t.project_id).maybeSingle()
        : Promise.resolve({ data: null }),
      t.milestone_id
        ? supabase.from("milestones").select("title").eq("id", t.milestone_id).maybeSingle()
        : Promise.resolve({ data: null }),
      fetchSubtaskListItems(taskId, orgId),
      supabase.from("task_assignees").select("user_id").eq("task_id", taskId),
      supabase.from("time_entries").select("id, user_id, started_at, ended_at, duration_seconds").eq("task_id", taskId).order("started_at", { ascending: false }),
      fetchTaskComments(taskId, orgId),
      fetchMentionableMembers(orgId),
      t.parent_id ? fetchParentTaskSummary(t.parent_id) : Promise.resolve(null),
    ]);

    const assigneeIds = (assigns.data ?? []).map((a) => a.user_id);
    const entryList = (times.data ?? []) as TaskTimeEntry[];

    const profileIds = new Set<string>([
      ...assigneeIds,
      t.created_by,
      ...entryList.map((e) => e.user_id),
      ...commentRows.map((c) => c.author_id),
    ]);

    if (user) profileIds.add(user.id);

    const [profileList, emailMap] = await Promise.all([
      fetchProfilesByIds([...profileIds], orgId),
      fetchProfileEmails(orgId, [...profileIds]),
    ]);

    const profileById = new Map(profileList.map((p) => [p.id, p]));

    setTask(t as Task);
    savedDescription.current = t.description ?? "";
    savedNote.current = t.note ?? "";
    setProjectName(projectRes.data?.name ?? null);
    setFolderName(folderRes.data?.title ?? null);
    setSubtasks(subtaskRows);
    setParentTask(parentSummary ? { id: parentSummary.id, title: parentSummary.title } : null);
    setComments(buildCommentTree(commentRows));
    setMentionMembers(members);
    setTimeEntries(entryList);
    setTotalTime(entryList.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0));
    setProfiles(profileList);
    setAssignees(profileList.filter((p) => assigneeIds.includes(p.id)));
    setCreatedBy(profileById.get(t.created_by) ?? null);

    syncTimerState();
    setDataVersion((v) => v + 1);
  }, [taskId, orgId, user, syncTimerState]);

  useEffect(() => {
    if (!taskId) return;
    loadData();

    const channel = supabase.channel(`task-${taskId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_assignees" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "time_entries" }, loadData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId, loadData]);

  useEffect(() => {
    if (!taskId) return;
    return subscribeTaskTimer(syncTimerState);
  }, [taskId, syncTimerState]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking) interval = setInterval(() => syncTimerState(), 1000);
    return () => clearInterval(interval);
  }, [isTracking, syncTimerState]);

  const profileMap = useMemo(() => profilesMap(profiles), [profiles]);
  const assigneeIds = useMemo(() => assignees.map((a) => a.id), [assignees]);

  const isAssignee = useMemo(() => {
    if (!user || !task) return false;
    return assigneeIds.includes(user.id) || task.assignee_id === user.id;
  }, [user, task, assigneeIds]);

  const liveTimer = useMemo(() => {
    if (!isTracking || !user) return undefined;
    const active = getActiveTaskTimer();
    if (!active || active.taskId !== taskId) return undefined;
    return {
      userId: user.id,
      startedAt: new Date(active.startedAt).toISOString(),
      seconds: sessionTime,
    };
  }, [isTracking, user, taskId, sessionTime]);

  const trackedTotal = totalTime + (isTracking ? sessionTime : 0);
  const todaySeconds = sumTodaySeconds(timeEntries, isTracking ? sessionTime : 0);

  const workers = useMemo(
    () => buildWorkerRows(
      timeEntries,
      profileMap,
      assigneeIds,
      liveTimer ? { userId: liveTimer.userId, seconds: liveTimer.seconds } : undefined,
    ),
    [timeEntries, profileMap, assigneeIds, liveTimer],
  );

  const todayEntries: TaskTimeEntryRow[] = useMemo(
    () => getTodayEntries(
      timeEntries,
      profileMap,
      liveTimer
        ? { userId: liveTimer.userId, startedAt: liveTimer.startedAt, liveSeconds: liveTimer.seconds }
        : undefined,
    ),
    [timeEntries, profileMap, liveTimer],
  );

  const weekTotals = useMemo(
    () => buildDailyTotals(timeEntries, profileMap, "week"),
    [timeEntries, profileMap],
  );

  const monthTotals = useMemo(
    () => buildDailyTotals(timeEntries, profileMap, "month"),
    [timeEntries, profileMap],
  );

  const activeNowUsers = useMemo(() => {
    if (!isTracking || !user) return [];
    const profile = profiles.find((p) => p.id === user.id);
    return profile
      ? [profile]
      : [{
        id: user.id,
        full_name: "You",
        avatar_url: null,
        email: user.email ?? null,
      }];
  }, [isTracking, user, profiles]);

  async function handleDescriptionChange(value: string) {
    if (!user || !task || !orgId) return;
    const previous = savedDescription.current;
    savedDescription.current = value;
    setTask({ ...task, description: value });

    const { error } = await supabase.from("tasks").update({ description: value }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      savedDescription.current = previous;
      return;
    }

    const authorName = profiles.find((p) => p.id === user.id)?.full_name ?? "Someone";
    await notifyTaskMentions({
      mentionIds: extractMentionIdsFromHtml(value, mentionMembers),
      previousMentionIds: extractMentionIdsFromHtml(previous, mentionMembers),
      authorId: user.id,
      authorName,
      taskId: task.id,
      taskTitle: task.title,
      orgId,
      context: "description",
    });
  }

  async function handleNoteChange(value: string) {
    if (!user || !task || !orgId) return;
    const previous = savedNote.current;
    savedNote.current = value;
    setTask({ ...task, note: value });

    const { error } = await supabase.from("tasks").update({ note: value }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      savedNote.current = previous;
      return;
    }

    const authorName = profiles.find((p) => p.id === user.id)?.full_name ?? "Someone";
    await notifyTaskMentions({
      mentionIds: extractMentionIdsFromHtml(value, mentionMembers),
      previousMentionIds: extractMentionIdsFromHtml(previous, mentionMembers),
      authorId: user.id,
      authorName,
      taskId: task.id,
      taskTitle: task.title,
      orgId,
      context: "note",
    });
  }

  async function handleCommentSubmit(body: string, parentId?: string | null) {
    if (!user || !task || !orgId) return;
    try {
      await createTaskComment({
        taskId: task.id,
        authorId: user.id,
        authorName: profiles.find((p) => p.id === user.id)?.full_name ?? "Someone",
        taskTitle: task.title,
        orgId,
        body,
        parentId,
        members: mentionMembers,
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    }
  }

  async function handleCommentUpdate(commentId: string, body: string) {
    if (!user || !task || !orgId) return;
    try {
      await updateTaskComment({
        commentId,
        body,
        members: mentionMembers,
        authorId: user.id,
        authorName: profiles.find((p) => p.id === user.id)?.full_name ?? "Someone",
        taskId: task.id,
        taskTitle: task.title,
        orgId,
      });
      loadData();
      toast.success("Comment updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update comment");
    }
  }

  async function handleCommentDelete(commentId: string) {
    try {
      await deleteTaskComment(commentId);
      loadData();
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment");
    }
  }

  async function toggleTimer() {
    if (!user || !task) return;

    const active = getActiveTaskTimer();
    if (active?.taskId === task.id) {
      const elapsed = getTimerElapsedSeconds(active);
      const startedAt = new Date(active.startedAt).toISOString();
      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        task_id: task.id,
        project_id: task.project_id,
        organization_id: orgId,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        duration_seconds: elapsed,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setActiveTaskTimer(null);
      setIsTracking(false);
      setSessionTime(0);
      toast.success("Time logged");
      loadData();
    } else {
      if (!isAssignee) {
        toast.error("Only assigned team members can start the timer.");
        return;
      }
      if (active && active.taskId !== task.id) {
        toast.error("Stop the timer on the other task first.");
        return;
      }
      setActiveTaskTimer({
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.project_id,
        startedAt: Date.now(),
        elapsedBefore: 0,
      });
      setIsTracking(true);
      setSessionTime(0);
      loadData();
    }
  }

  async function handleDelete() {
    if (!task || !confirm("Delete this task? This cannot be undone.")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task deleted");
    if (task.parent_id) {
      navigate({ to: "/tasks/$taskId", params: { taskId: task.parent_id } });
    } else {
      navigate({ to: "/tasks" });
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!task) return;
    setTask({ ...task, status: newStatus });
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (error) toast.error(error.message);
  }

  if (!task) {
    return (
      <AppShell>
        <BackLink to="/tasks" className="mb-4">Back to Tasks</BackLink>
        <div className="text-sm text-muted-foreground">Loading task…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-24">
        <BackLink to={parentTask ? `/tasks/${parentTask.id}` : "/tasks"}>
          {parentTask ? `Back to ${parentTask.title}` : "Back to tasks"}
        </BackLink>

        <TaskDetailsHeader
          task={task}
          projectName={projectName}
          parentTask={parentTask}
          onEdit={() => setShowEditModal(true)}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          canDelete={user?.id === task.created_by}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TaskDetailsDescription
              description={task.description}
              note={task.note}
              members={mentionMembers}
              onDescriptionChange={handleDescriptionChange}
              onNoteChange={handleNoteChange}
            />

            {orgId && (
              <TaskDetailsAttachments
                orgId={orgId}
                taskId={task.id}
                refreshKey={dataVersion}
              />
            )}

            <TaskDetailsTimeCard
              totalSeconds={trackedTotal}
              isTracking={isTracking}
              sessionSeconds={sessionTime}
              canStartTimer={isAssignee}
              onToggleTimer={toggleTimer}
            />

            <TaskDetailsWorkers workers={workers} />
            <TaskDetailsTimeEntries entries={todayEntries} />
            <TaskDetailsDailyTotals weekTotals={weekTotals} monthTotals={monthTotals} />
            <TaskDetailsComments
              comments={comments}
              members={mentionMembers}
              currentUserId={user?.id}
              canModerate={hasAny("owner", "admin")}
              onSubmit={handleCommentSubmit}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
            />

            {user && orgId && (
              <TaskDetailsSubtasks
                parentTask={task}
                subtasks={subtasks}
                orgId={orgId}
                userId={user.id}
                onChange={loadData}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <TaskDetailsMetaSidebar
              assignees={assignees}
              createdBy={createdBy}
              todaySeconds={todaySeconds}
              totalSeconds={trackedTotal}
              createdAt={task.created_at}
              updatedAt={task.updated_at}
              folderName={folderName}
              estimatedHours={task.estimated_hours}
              dueDate={task.due_date}
            />
          </div>
        </div>
      </div>

      <TaskDetailsActivePanel
        isTracking={isTracking}
        activeUsers={activeNowUsers}
        currentUserId={user?.id}
      />

      {user && orgId && (
        <EditTaskModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          orgId={orgId}
          userId={user.id}
          taskId={task.id}
          onSuccess={loadData}
        />
      )}
    </AppShell>
  );
}
