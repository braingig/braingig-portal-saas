import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CreateProjectFolderModal } from "@/components/projects/create-project-folder-modal";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { TaskPreviewModal } from "@/components/tasks/preview/task-preview-modal";
import { TaskProjectGroup } from "@/components/tasks/task-project-group";
import { TasksBoardPlaceholder } from "@/components/tasks/tasks-board-placeholder";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { tasksProjectStack, tasksSecondary } from "@/components/tasks/tasks-page-styles";
import {
  TASKS_FILTER_ALL,
  TASKS_FILTER_STANDALONE,
  TasksToolbar,
} from "@/components/tasks/tasks-toolbar";
import type { TasksViewMode } from "@/components/tasks/tasks-view-switcher";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { fetchProfileEmails } from "@/lib/profile-emails";
import {
  applyTasksListFilters,
  DEFAULT_TASKS_LIST_FILTERS,
  type TasksListFilters,
} from "@/lib/tasks/filters";
import { fetchAssignableMembers } from "@/lib/tasks/org-members";
import {
  filterTasksForSearch,
  groupSearchMatchRank,
  taskOrSubtasksMatchSearch,
} from "@/lib/tasks/search";
import { fetchOrgSubtasksMap } from "@/lib/tasks/subtasks";
import { countOpenTasks } from "@/lib/tasks/status";
import type { TaskListItem, TaskMilestone, TaskOrgMember, TaskProjectGroup as ProjectGroup } from "@/lib/tasks/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/")({
  head: () => ({ meta: [{ title: "Tasks · WorkPilot" }] }),
  component: TasksPage,
});

function TasksPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [subtasksByParent, setSubtasksByParent] = useState<Map<string, TaskListItem[]>>(new Map());
  const [milestones, setMilestones] = useState<TaskMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState(TASKS_FILTER_ALL);
  const [listFilters, setListFilters] = useState<TasksListFilters>(DEFAULT_TASKS_LIST_FILTERS);
  const [viewMode, setViewMode] = useState<TasksViewMode>("list");
  const [members, setMembers] = useState<TaskOrgMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>();
  const [defaultMilestoneId, setDefaultMilestoneId] = useState<string | undefined>();
  const [folderProjectId, setFolderProjectId] = useState<string | null>(null);
  const [subtaskParent, setSubtaskParent] = useState<TaskListItem | null>(null);
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);

  const loadTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const loadRef = useRef<() => Promise<void>>(async () => {});

  async function load() {
    if (!orgId) return;

    const [tRes, pRes, mRes, subtaskMap, memberList] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assignee_id, project_id, milestone_id, created_by, created_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url), projects(name)")
        .eq("organization_id", orgId)
        .is("parent_id", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name"),
      supabase
        .from("milestones")
        .select("id, title, project_id, position")
        .eq("organization_id", orgId)
        .order("position", { ascending: true }),
      fetchOrgSubtasksMap(orgId),
      fetchAssignableMembers(orgId),
    ]);

    if (tRes.error) toast.error("Failed to load tasks: " + tRes.error.message);
    else if (tRes.data) {
      const rows = tRes.data as unknown as TaskListItem[];
      const assigneeIds = rows.map((t) => t.assignee_id).filter(Boolean) as string[];
      const emailMap = await fetchProfileEmails(orgId, assigneeIds);
      setTasks(rows.map((task) => ({
        ...task,
        profiles: task.profiles && task.assignee_id
          ? { ...task.profiles, email: emailMap.get(task.assignee_id) ?? null }
          : task.profiles,
      })));
    }

    if (pRes.error) toast.error("Failed to load projects: " + pRes.error.message);
    else if (pRes.data) setProjects(pRes.data);

    if (mRes.error) toast.error("Failed to load folders: " + mRes.error.message);
    else if (mRes.data) setMilestones(mRes.data as TaskMilestone[]);

    setSubtasksByParent(subtaskMap);
    setMembers(memberList);

    setLoading(false);
  }

  loadRef.current = load;

  const scheduleLoad = useCallback(() => {
    clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => void loadRef.current(), 600);
  }, []);

  useEffect(() => { void load(); }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`org-${orgId}-tasks`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `organization_id=eq.${orgId}` }, scheduleLoad)
      .on("postgres_changes", { event: "*", schema: "public", table: "milestones", filter: `organization_id=eq.${orgId}` }, scheduleLoad)
      .subscribe();
    return () => {
      clearTimeout(loadTimerRef.current);
      supabase.removeChannel(ch);
    };
  }, [orgId, scheduleLoad]);

  function openCreateModal(projectId?: string, milestoneId?: string | null) {
    setSubtaskParent(null);
    setDefaultProjectId(projectId);
    setDefaultMilestoneId(milestoneId ?? undefined);
    setShowCreateModal(true);
  }

  function openCreateSubtaskModal(task: TaskListItem) {
    setSubtaskParent(task);
    setDefaultProjectId(task.project_id ?? undefined);
    setDefaultMilestoneId(task.milestone_id ?? undefined);
    setShowCreateModal(true);
  }

  function openFolderModal(projectId: string) {
    setFolderProjectId(projectId);
    setShowFolderModal(true);
  }

  function openEditModal(task: TaskListItem) {
    setEditingTaskId(task.id);
    setShowEditModal(true);
  }

  function openTaskPreview(taskId: string) {
    setPreviewTaskId(taskId);
  }

  async function changeStatus(task: TaskListItem, newStatus: string) {
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (error) toast.error(error.message);
    else {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      setSubtasksByParent((prev) => {
        const next = new Map(prev);
        for (const [parentId, subs] of next) {
          if (subs.some((s) => s.id === task.id)) {
            next.set(parentId, subs.map((s) => (s.id === task.id ? { ...s, status: newStatus } : s)));
          }
        }
        return next;
      });
    }
  }

  async function toggleStatus(task: TaskListItem) {
    changeStatus(task, task.status === "done" ? "todo" : "done");
  }

  const filteredTasks = useMemo(
    () => applyTasksListFilters(tasks, listFilters, user?.id),
    [tasks, listFilters, user?.id],
  );

  const groups = useMemo(() => {
    const result: ProjectGroup[] = [];

    if (projectFilter === TASKS_FILTER_STANDALONE) {
      result.push({
        id: "standalone",
        name: "Standalone tasks",
        isStandalone: true,
        tasks: filteredTasks.filter((t) => !t.project_id),
      });
      return result;
    }

    const projectIds = projectFilter === TASKS_FILTER_ALL
      ? projects.map((p) => p.id)
      : [projectFilter];

    for (const project of projects.filter((p) => projectIds.includes(p.id))) {
      const projectTasks = filteredTasks.filter((t) => t.project_id === project.id);
      const showEmptyGroup = projectFilter === project.id;
      if (projectTasks.length > 0 || showEmptyGroup) {
        result.push({
          id: project.id,
          name: project.name,
          tasks: projectTasks,
        });
      }
    }

    const standalone = filteredTasks.filter((t) => !t.project_id);
    const showStandalone = projectFilter === TASKS_FILTER_ALL;
    if (showStandalone && standalone.length > 0) {
      result.push({
        id: "standalone",
        name: "Standalone tasks",
        isStandalone: true,
        tasks: standalone,
      });
    }

    const q = searchQuery.trim();
    if (!q) return result;

    return result
      .map((group) => ({
        ...group,
        tasks: filterTasksForSearch(group.tasks, subtasksByParent, searchQuery),
      }))
      .filter((group) => group.tasks.length > 0)
      .sort(
        (a, b) =>
          groupSearchMatchRank(a.tasks, subtasksByParent, searchQuery) -
          groupSearchMatchRank(b.tasks, subtasksByParent, searchQuery),
      );
  }, [filteredTasks, projectFilter, projects, searchQuery, subtasksByParent]);

  const hasSearchMatches = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return true;
    return filteredTasks.some((t) => taskOrSubtasksMatchSearch(t, subtasksByParent.get(t.id), searchQuery));
  }, [filteredTasks, searchQuery, subtasksByParent]);

  const projectsWithTasks = useMemo(
    () => new Set(filteredTasks.filter((t) => t.project_id).map((t) => t.project_id)).size,
    [filteredTasks],
  );

  const isProjectFiltered = projectFilter !== TASKS_FILTER_ALL;
  const showEmptyState = groups.length === 0;

  const folderCountForProject = folderProjectId
    ? milestones.filter((m) => m.project_id === folderProjectId).length
    : 0;

  const openTaskCount = countOpenTasks(filteredTasks);
  const doneCount = filteredTasks.filter((t) => t.status === "done").length;
  const statsLine = `${openTaskCount} Open · ${doneCount} Completed · ${projectsWithTasks} ${projectsWithTasks === 1 ? "Project" : "Projects"}`;

  if (loading) {
    return (
      <AppShell title="Tasks">
        <div className="text-sm text-muted-foreground">Loading tasks…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tasks"
      subtitle={statsLine}
    >
      <div className="space-y-4 pb-6">
        <div className="border-b border-border/30 pb-4">
          <TasksToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            projects={projects}
            filters={listFilters}
            onFiltersChange={setListFilters}
            assignees={members}
            creators={members}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {viewMode === "board" ? (
          <TasksBoardPlaceholder />
        ) : searchQuery.trim() && !hasSearchMatches ? (
          <p className={cn(tasksSecondary, "rounded-lg border border-border/40 bg-surface/30 px-3 py-2.5")}>
            No tasks match &ldquo;{searchQuery.trim()}&rdquo;.
          </p>
        ) : showEmptyState ? (
          <TasksEmptyState
            onCreateTask={() => openCreateModal()}
            filtered={isProjectFiltered || Boolean(searchQuery.trim()) || tasks.length > 0}
          />
        ) : (
          <div className={tasksProjectStack}>
            {groups.map((group) => (
              <TaskProjectGroup
                key={group.id}
                group={group}
                milestones={milestones}
                subtasksByParent={subtasksByParent}
                searchQuery={searchQuery}
                onAddTask={openCreateModal}
                onCreateFolder={openFolderModal}
                onToggleComplete={toggleStatus}
                onStatusChange={changeStatus}
                onEdit={openEditModal}
                onAddSubtask={openCreateSubtaskModal}
                onOpenTask={openTaskPreview}
                defaultExpanded={Boolean(searchQuery.trim()) || group.tasks.length > 0 || projectFilter === group.id}
              />
            ))}
          </div>
        )}
      </div>

      {user && orgId && (
        <>
          <CreateTaskModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) setSubtaskParent(null);
            }}
            orgId={orgId}
            userId={user.id}
            defaultProjectId={defaultProjectId}
            defaultMilestoneId={defaultMilestoneId}
            parentTaskId={subtaskParent?.id}
            subtaskPosition={subtaskParent ? (subtasksByParent.get(subtaskParent.id)?.length ?? 0) : undefined}
            onSuccess={load}
          />

          {editingTaskId && (
            <EditTaskModal
              open={showEditModal}
              onOpenChange={(open) => {
                setShowEditModal(open);
                if (!open) setEditingTaskId(null);
              }}
              orgId={orgId}
              userId={user.id}
              taskId={editingTaskId}
              onSuccess={load}
            />
          )}

          {folderProjectId && (
            <CreateProjectFolderModal
              open={showFolderModal}
              onOpenChange={setShowFolderModal}
              projectId={folderProjectId}
              orgId={orgId}
              userId={user.id}
              folderCount={folderCountForProject}
              onSuccess={load}
            />
          )}

          <TaskPreviewModal
            taskId={previewTaskId}
            open={Boolean(previewTaskId)}
            onOpenChange={(open) => {
              if (!open) setPreviewTaskId(null);
            }}
            onTaskChange={setPreviewTaskId}
            onUpdated={scheduleLoad}
          />
        </>
      )}
    </AppShell>
  );
}
