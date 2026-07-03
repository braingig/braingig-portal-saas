import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { fetchProfileEmails } from "@/lib/profile-emails";
import { listTaskAttachments } from "@/lib/tasks/attachments";
import { extractMentionIdsFromHtml } from "@/lib/tasks/comment-mentions";
import {
  buildCommentTree,
  countComments,
  createTaskComment,
  deleteTaskComment,
  fetchTaskComments,
  updateTaskComment,
  type TaskCommentNode,
} from "@/lib/tasks/comments";
import { notifyTaskMentions } from "@/lib/tasks/mention-notifications";
import { fetchMentionableMembers, fetchProfilesByIds } from "@/lib/tasks/org-members";
import { fetchSubtaskListItems } from "@/lib/tasks/subtasks";
import {
  getActiveTaskTimer,
  getTimerElapsedSeconds,
  setActiveTaskTimer,
  subscribeTaskTimer,
} from "@/lib/task-timer";
import type {
  TaskDetailProfile,
  TaskDetailRecord,
  TaskListItem,
  TaskOrgMember,
  TaskTimeEntry,
} from "@/lib/tasks/types";
import { toast } from "sonner";

export type TaskPreviewAudit = {
  id: string;
  action: string;
  actor_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type LoadOptions = {
  /** Background refresh — keeps modal content mounted (no loading flash). */
  silent?: boolean;
};

export function useTaskPreviewData(
  taskId: string | null,
  open: boolean,
  onUpdated?: () => void,
) {
  const { user } = useAuth();
  const { orgId } = useOrganization();

  const [task, setTask] = useState<TaskDetailRecord | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<TaskListItem[]>([]);
  const [comments, setComments] = useState<TaskCommentNode[]>([]);
  const [flatComments, setFlatComments] = useState<Awaited<ReturnType<typeof fetchTaskComments>>>([]);
  const [mentionMembers, setMentionMembers] = useState<TaskOrgMember[]>([]);
  const [assignees, setAssignees] = useState<TaskDetailProfile[]>([]);
  const [profiles, setProfiles] = useState<TaskDetailProfile[]>([]);
  const [timeEntries, setTimeEntries] = useState<TaskTimeEntry[]>([]);
  const [audits, setAudits] = useState<TaskPreviewAudit[]>([]);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);

  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  const taskRef = useRef<TaskDetailRecord | null>(null);
  taskRef.current = task;

  const loadedForRef = useRef<string | null>(null);

  const notifyParentTimer = useRef<ReturnType<typeof setTimeout>>();
  const notifyParent = useCallback(() => {
    clearTimeout(notifyParentTimer.current);
    notifyParentTimer.current = setTimeout(() => onUpdatedRef.current?.(), 800);
  }, []);

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

  const loadData = useCallback(async (options?: LoadOptions) => {
    if (!taskId || !orgId || !open) return;
    const silent = options?.silent ?? false;
    const showSpinner = !silent && (!taskRef.current || taskRef.current.id !== taskId);
    if (showSpinner) setLoading(true);

    try {
      const { data: t } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      if (!t) return;

      const [
        projectRes,
        folderRes,
        subtaskRows,
        assigns,
        times,
        commentRows,
        members,
        auditRes,
        attachments,
      ] = await Promise.all([
        t.project_id
          ? supabase.from("projects").select("name").eq("id", t.project_id).maybeSingle()
          : Promise.resolve({ data: null }),
        t.milestone_id
          ? supabase.from("milestones").select("title").eq("id", t.milestone_id).maybeSingle()
          : Promise.resolve({ data: null }),
        fetchSubtaskListItems(taskId, orgId),
        supabase.from("task_assignees").select("user_id").eq("task_id", taskId),
        supabase
          .from("time_entries")
          .select("id, user_id, started_at, ended_at, duration_seconds")
          .eq("task_id", taskId)
          .order("started_at", { ascending: false }),
        fetchTaskComments(taskId, orgId),
        fetchMentionableMembers(orgId),
        supabase
          .from("audit_logs")
          .select("id, action, actor_id, created_at, metadata")
          .eq("entity_id", taskId)
          .eq("entity_type", "task")
          .order("created_at", { ascending: false })
          .limit(50),
        listTaskAttachments(orgId, taskId).catch(() => []),
      ]);

      const assigneeIds = (assigns.data ?? []).map((a) => a.user_id);
      const entryList = (times.data ?? []) as TaskTimeEntry[];
      const profileIds = new Set<string>([
        ...assigneeIds,
        t.created_by,
        ...entryList.map((e) => e.user_id),
        ...commentRows.map((c) => c.author_id),
        ...(auditRes.data ?? []).map((a) => a.actor_id).filter(Boolean) as string[],
      ]);
      if (user) profileIds.add(user.id);

      const [profileList, emailMap] = await Promise.all([
        fetchProfilesByIds([...profileIds], orgId),
        fetchProfileEmails(orgId, [...profileIds]),
      ]);

      const enriched = profileList.map((p) => ({
        ...p,
        email: emailMap.get(p.id) ?? p.email ?? null,
      }));

      setTask(t as TaskDetailRecord);
      setProjectName(projectRes.data?.name ?? null);
      setFolderName(folderRes.data?.title ?? null);
      setSubtasks(subtaskRows);
      setFlatComments(commentRows);
      setComments(buildCommentTree(commentRows));
      setMentionMembers(members);
      setTimeEntries(entryList);
      setAudits((auditRes.data ?? []) as TaskPreviewAudit[]);
      setAttachmentCount(attachments.length);
      setTotalTime(entryList.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0));
      setProfiles(enriched);
      setAssignees(enriched.filter((p) => assigneeIds.includes(p.id)));
      syncTimerState();
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [taskId, orgId, user, open, syncTimerState]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const skipNextTaskRealtime = useRef(false);

  const scheduleSilentRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void loadDataRef.current({ silent: true }), 400);
  }, []);

  useEffect(() => {
    if (!open || !taskId) return;
    const silent = loadedForRef.current === taskId && taskRef.current !== null;
    void loadDataRef.current({ silent });
    loadedForRef.current = taskId;
  }, [open, taskId]);

  useEffect(() => {
    if (!open) loadedForRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!open || !taskId) return;
    const channel = supabase
      .channel(`task-preview-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `id=eq.${taskId}` },
        () => {
          if (skipNextTaskRealtime.current) {
            skipNextTaskRealtime.current = false;
            return;
          }
          scheduleSilentRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        scheduleSilentRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignees", filter: `task_id=eq.${taskId}` },
        scheduleSilentRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries", filter: `task_id=eq.${taskId}` },
        scheduleSilentRefresh,
      )
      .subscribe();
    return () => {
      clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [open, taskId, scheduleSilentRefresh]);

  useEffect(() => {
    if (!open || !taskId) return;
    return subscribeTaskTimer(syncTimerState);
  }, [open, taskId, syncTimerState]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking && open) interval = setInterval(syncTimerState, 1000);
    return () => clearInterval(interval);
  }, [isTracking, open, syncTimerState]);

  useEffect(() => () => {
    clearTimeout(notifyParentTimer.current);
    clearTimeout(refreshTimer.current);
  }, []);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const assigneeIds = useMemo(() => assignees.map((a) => a.id), [assignees]);
  const commentCount = useMemo(() => countComments(comments), [comments]);
  const trackedTotal = totalTime + (isTracking ? sessionTime : 0);

  const isAssignee = useMemo(() => {
    if (!user || !task) return false;
    return assigneeIds.includes(user.id) || task.assignee_id === user.id;
  }, [user, task, assigneeIds]);

  const nameOf = useCallback(
    (userId: string | null | undefined) => {
      if (!userId) return "Someone";
      if (userId === user?.id) return "You";
      return profileMap.get(userId)?.full_name ?? "Someone";
    },
    [profileMap, user?.id],
  );

  const patchTask = useCallback(async (fields: Partial<TaskDetailRecord>) => {
    if (!taskId) return false;
    const { error } = await supabase.from("tasks").update(fields).eq("id", taskId);
    if (error) {
      toast.error(error.message);
      return false;
    }
    skipNextTaskRealtime.current = true;
    setTask((current) => (current ? { ...current, ...fields } : current));
    notifyParent();
    return true;
  }, [taskId, notifyParent]);

  const saveDescription = useCallback(async (value: string, previous: string) => {
    if (!user || !task || !orgId) return;
    if (value === previous) return;

    const ok = await patchTask({ description: value });
    if (!ok) return;

    const authorName = profiles.find((p) => p.id === user.id)?.full_name ?? "Someone";
    try {
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
    } catch (err) {
      console.warn("Mention notification failed:", err);
    }
  }, [user, task, orgId, profiles, mentionMembers, patchTask]);

  const postComment = useCallback(async (body: string, parentId?: string | null) => {
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
      notifyParent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    }
  }, [user, task, orgId, profiles, mentionMembers, notifyParent]);

  const updateComment = useCallback(async (commentId: string, body: string) => {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update comment");
    }
  }, [user, task, orgId, profiles, mentionMembers]);

  const removeComment = useCallback(async (commentId: string) => {
    try {
      await deleteTaskComment(commentId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    }
  }, []);

  const syncAssignees = useCallback(async (ids: string[]) => {
    if (!task) return;
    skipNextTaskRealtime.current = true;
    const { error: e1 } = await supabase
      .from("tasks")
      .update({ assignee_id: ids[0] ?? null })
      .eq("id", task.id);
    if (e1) { toast.error(e1.message); return; }
    await supabase.from("task_assignees").delete().eq("task_id", task.id);
    if (ids.length > 0) {
      const { error: e2 } = await supabase.from("task_assignees").insert(
        ids.map((user_id) => ({ task_id: task.id, user_id })),
      );
      if (e2) { toast.error(e2.message); return; }
    }
    setAssignees(profiles.filter((p) => ids.includes(p.id)));
    notifyParent();
  }, [task, profiles, notifyParent]);

  const toggleTimer = useCallback(async () => {
    if (!user || !task || !orgId) return;
    const active = getActiveTaskTimer();
    if (active?.taskId === task.id) {
      const elapsed = getTimerElapsedSeconds(active);
      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        task_id: task.id,
        project_id: task.project_id,
        organization_id: orgId,
        started_at: new Date(active.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: elapsed,
      });
      if (error) { toast.error(error.message); return; }
      setActiveTaskTimer(null);
      setIsTracking(false);
      toast.success("Time logged");
      notifyParent();
    } else {
      if (!isAssignee) { toast.error("Only assigned members can start the timer."); return; }
      if (active) { toast.error("Stop the timer on the other task first."); return; }
      setActiveTaskTimer({
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.project_id,
        startedAt: Date.now(),
        elapsedBefore: 0,
      });
      setIsTracking(true);
    }
  }, [user, task, orgId, isAssignee, notifyParent]);

  const deleteTask = useCallback(async () => {
    if (!task) return false;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Task deleted");
    notifyParent();
    return true;
  }, [task, notifyParent]);

  const reload = useCallback(() => loadData({ silent: true }), [loadData]);

  const saveNote = useCallback(async (value: string, previous: string) => {
    if (!user || !task || !orgId) return;
    if (value === previous) return;

    const ok = await patchTask({ note: value });
    if (!ok) return;

    const authorName = profiles.find((p) => p.id === user.id)?.full_name ?? "Someone";
    try {
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
    } catch (err) {
      console.warn("Mention notification failed:", err);
    }
  }, [user, task, orgId, profiles, mentionMembers, patchTask]);

  return {
    user,
    orgId,
    task,
    projectName,
    folderName,
    subtasks,
    comments,
    flatComments,
    mentionMembers,
    assignees,
    profiles,
    timeEntries,
    audits,
    attachmentCount,
    loading,
    isTracking,
    sessionTime,
    trackedTotal,
    commentCount,
    isAssignee,
    nameOf,
    loadData: reload,
    patchTask,
    saveDescription,
    saveNote,
    postComment,
    updateComment,
    removeComment,
    syncAssignees,
    toggleTimer,
    deleteTask,
  };
}
