import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { fetchProfileEmails } from "@/lib/profile-emails";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import {
  createTaskChecklistItem,
  deleteTaskChecklistItem,
  fetchTaskChecklistItems,
  TASK_CHECKLIST_ASSIGNEE_MIGRATION_HINT,
  TASK_CHECKLIST_MIGRATION_HINT,
  updateTaskChecklistItem,
  type TaskChecklistItem,
} from "@/lib/tasks/checklist";
import { logTaskAssigneeChange, logTaskFieldChange } from "@/lib/tasks/task-audit";
import { listTaskAttachments } from "@/lib/tasks/attachments";
import { deleteTaskRecord } from "@/lib/tasks/delete-task";
import {
  buildCommentTree,
  countRootComments,
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
  subscribeTaskTimer,
} from "@/lib/task-timer";
import {
  isTaskAssignee,
  isTimerStartBlocked,
  toggleTaskTimer,
} from "@/lib/tasks/toggle-task-timer";
import type {
  TaskDetailProfile,
  TaskDetailRecord,
  TaskListItem,
  TaskOrgMember,
  TaskTimeEntry,
} from "@/lib/tasks/types";
import { toast } from "sonner";

export const TASK_START_DATE_MIGRATION_HINT =
  "Run supabase/migrations/20260704_task_start_date.sql in your Supabase SQL Editor to save start dates.";

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
  const [checklistItems, setChecklistItems] = useState<TaskChecklistItem[]>([]);
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
  const [timerStartBlocked, setTimerStartBlocked] = useState(false);
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
      setTimerStartBlocked(false);
    } else {
      setIsTracking(false);
      setSessionTime(0);
      setTimerStartBlocked(isTimerStartBlocked(false));
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
        checklistRows,
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
        fetchTaskChecklistItems(taskId),
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
      setChecklistItems(checklistRows);
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

  const refreshComments = useCallback(async () => {
    if (!taskId || !orgId) return;
    const commentRows = await fetchTaskComments(taskId, orgId);
    setFlatComments(commentRows);
    setComments(buildCommentTree(commentRows));

    const authorIds = commentRows.map((c) => c.author_id);
    if (authorIds.length === 0) return;

    const [profileList, emailMap] = await Promise.all([
      fetchProfilesByIds([...new Set(authorIds)], orgId),
      fetchProfileEmails(orgId, [...new Set(authorIds)]),
    ]);

    setProfiles((current) => {
      const byId = new Map(current.map((p) => [p.id, p]));
      for (const p of profileList) {
        byId.set(p.id, {
          ...p,
          email: emailMap.get(p.id) ?? p.email ?? null,
        });
      }
      return [...byId.values()];
    });
  }, [taskId, orgId]);

  const refreshAudits = useCallback(async () => {
    if (!taskId) return;
    const rows = await fetchTaskAudits(taskId);
    setAudits(rows);
  }, [taskId]);

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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs", filter: `entity_id=eq.${taskId}` },
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
  const commentCount = useMemo(() => countRootComments(comments), [comments]);
  const trackedTotal = totalTime + (isTracking ? sessionTime : 0);

  const isAssignee = useMemo(() => {
    if (!user || !task) return false;
    return isTaskAssignee(user.id, assigneeIds, task.assignee_id);
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
    if (!taskId || !task) return false;

    const changes = Object.entries(fields).filter(([key, value]) => {
      return task[key as keyof TaskDetailRecord] !== value;
    });
    if (changes.length === 0) return true;

    const { error } = await supabase.from("tasks").update(fields).eq("id", taskId);
    if (error) {
      if (fields.start_date !== undefined && isMissingColumnError(error)) {
        toast.warning(TASK_START_DATE_MIGRATION_HINT);
        return false;
      }
      toast.error(error.message);
      return false;
    }

    await Promise.all(
      changes.map(([field, value]) =>
        logTaskFieldChange(
          taskId,
          field,
          value,
          task[field as keyof TaskDetailRecord],
        ),
      ),
    );

    skipNextTaskRealtime.current = true;
    setTask((current) => (current ? { ...current, ...fields } : current));
    await refreshAudits();
    notifyParent();
    return true;
  }, [taskId, task, notifyParent, refreshAudits]);

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
      await refreshComments();
      notifyParent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
      throw err;
    }
  }, [user, task, orgId, profiles, mentionMembers, notifyParent, refreshComments]);

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
      await refreshComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update comment");
      throw err;
    }
  }, [user, task, orgId, profiles, mentionMembers, refreshComments]);

  const removeComment = useCallback(async (commentId: string) => {
    try {
      await deleteTaskComment(commentId);
      await refreshComments();
      notifyParent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
      throw err;
    }
  }, [notifyParent, refreshComments]);

  const syncAssignees = useCallback(async (ids: string[]) => {
    if (!task) return;
    const previousIds = assigneeIds;
    if (
      previousIds.length === ids.length
      && previousIds.every((id) => ids.includes(id))
    ) {
      return;
    }

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

    const assigneeNames = ids.map(
      (id) => profiles.find((p) => p.id === id)?.full_name ?? "Someone",
    );
    await logTaskAssigneeChange(task.id, ids, assigneeNames);

    setAssignees(profiles.filter((p) => ids.includes(p.id)));
    await refreshAudits();
    notifyParent();
  }, [task, assigneeIds, profiles, notifyParent, refreshAudits]);

  const toggleTimer = useCallback(async () => {
    if (!user || !task || !orgId) return;

    const authorName = profiles.find((p) => p.id === user.id)?.full_name ?? "Someone";
    const result = await toggleTaskTimer({
      userId: user.id,
      userName: authorName,
      orgId,
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.project_id,
      assigneeIds,
      legacyAssigneeId: task.assignee_id,
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (result.action === "stopped") {
      setIsTracking(false);
      setTimerStartBlocked(false);
      toast.success("Time logged");
      void loadDataRef.current({ silent: true });
      notifyParent();
      return;
    }

    setIsTracking(true);
    setTimerStartBlocked(false);

    if (result.autoAssigned) {
      skipNextTaskRealtime.current = true;
      const selfProfile = profiles.find((p) => p.id === user.id);
      if (selfProfile) {
        setAssignees((current) =>
          current.some((a) => a.id === user.id) ? current : [...current, selfProfile],
        );
      }
      toast.success("You were assigned and the timer started");
      void loadDataRef.current({ silent: true });
    }

    notifyParent();
  }, [user, task, orgId, assigneeIds, profiles, notifyParent]);

  const deleteTask = useCallback(async () => {
    if (!task || !orgId) return false;
    try {
      await deleteTaskRecord(orgId, task.id);
      toast.success(task.parent_id ? "Subtask deleted" : "Task deleted");
      notifyParent();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
      return false;
    }
  }, [task, orgId, notifyParent]);

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

  const addChecklistItem = useCallback(async (title: string, assigneeId: string | null) => {
    if (!user || !task) return;
    try {
      const item = await createTaskChecklistItem({
        taskId: task.id,
        title,
        position: checklistItems.length,
        userId: user.id,
        assigneeId,
      });
      setChecklistItems((current) => [...current, item]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add checklist item";
      if (msg.includes("task_checklist_items")) {
        toast.warning(TASK_CHECKLIST_MIGRATION_HINT);
      } else if (msg.includes("assignee_id")) {
        toast.warning(TASK_CHECKLIST_ASSIGNEE_MIGRATION_HINT);
      } else {
        toast.error(msg);
      }
      throw err;
    }
  }, [user, task, checklistItems.length]);

  const assignChecklistItem = useCallback(async (item: TaskChecklistItem, assigneeId: string | null) => {
    const member = mentionMembers.find((m) => m.id === assigneeId);
    const previous = item;
    setChecklistItems((current) =>
      current.map((row) =>
        row.id === item.id
          ? {
              ...row,
              assignee_id: assigneeId,
              assignee: assigneeId && member
                ? { id: member.id, full_name: member.full_name, avatar_url: member.avatar_url }
                : null,
            }
          : row,
      ),
    );
    try {
      const updated = await updateTaskChecklistItem(item.id, { assignee_id: assigneeId });
      if (updated) {
        setChecklistItems((current) =>
          current.map((row) => (row.id === item.id ? updated : row)),
        );
      }
    } catch (err: unknown) {
      setChecklistItems((current) =>
        current.map((row) => (row.id === item.id ? previous : row)),
      );
      const msg = err instanceof Error ? err.message : "Failed to update assignee";
      if (msg.includes("assignee_id")) {
        toast.warning(TASK_CHECKLIST_ASSIGNEE_MIGRATION_HINT);
      } else {
        toast.error(msg);
      }
    }
  }, [mentionMembers]);

  const toggleChecklistItem = useCallback(async (item: TaskChecklistItem) => {
    const next = !item.is_completed;
    setChecklistItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, is_completed: next } : row)),
    );
    try {
      await updateTaskChecklistItem(item.id, { is_completed: next });
    } catch (err: unknown) {
      setChecklistItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, is_completed: item.is_completed } : row)),
      );
      toast.error(err instanceof Error ? err.message : "Failed to update checklist item");
    }
  }, []);

  const removeChecklistItem = useCallback(async (item: TaskChecklistItem) => {
    const previous = checklistItems;
    setChecklistItems((current) => current.filter((row) => row.id !== item.id));
    try {
      await deleteTaskChecklistItem(item.id);
    } catch (err: unknown) {
      setChecklistItems(previous);
      toast.error(err instanceof Error ? err.message : "Failed to delete checklist item");
    }
  }, [checklistItems]);

  return {
    user,
    orgId,
    task,
    projectName,
    folderName,
    subtasks,
    checklistItems,
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
    timerStartBlocked,
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
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    assignChecklistItem,
  };
}
