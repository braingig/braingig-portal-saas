import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  addDays,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskPreviewModal } from "@/components/tasks/preview/task-preview-modal";
import { FeedDetailModal, type FeedDetailItem } from "@/components/my-tasks/feed-detail-modal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { stripHtml } from "@/lib/format";
import { getCommentDisplayText } from "@/lib/tasks/comment-attachments";
import { getTaskStatusMeta, TASK_STATUS_PILL } from "@/lib/tasks/status";
import type { TaskListItem } from "@/lib/tasks/types";
import {
  formatTimerSeconds,
  getActiveTaskTimer,
  subscribeTaskTimer,
} from "@/lib/task-timer";
import { cn } from "@/lib/utils";

type MyTask = TaskListItem & { created_by?: string; updated_at?: string };
type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entity_id: string | null;
  entity_type: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type CommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  tasks: {
    id: string;
    title: string;
    project_id: string | null;
    projects: { name: string } | null;
  };
};

const SCROLL_SM = "max-h-36 overflow-y-auto overscroll-contain";
const SCROLL_PANEL = "max-h-44 overflow-y-auto overscroll-contain xl:max-h-none xl:flex-1";
const COLUMN_STACK = "flex flex-col gap-4 xl:h-[30rem]";

export const Route = createFileRoute("/_authenticated/my-tasks")({
  head: () => ({ meta: [{ title: "My Tasks · WorkPilot" }] }),
  component: MyTasksPage,
});

function parseTaskIdFromNotif(n: Notif, commentTaskMap: Map<string, string>): string | null {
  const fromLink = n.link?.match(/\/tasks\/([a-f0-9-]+)/i)?.[1];
  if (fromLink) return fromLink;
  if (n.entity_type === "task" && n.entity_id) return n.entity_id;
  if (n.entity_type === "task_comment" && n.entity_id) return commentTaskMap.get(n.entity_id) ?? null;
  return null;
}

function MyTasksPage() {
  const { user, profile } = useAuth();
  const { orgId } = useOrganization();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentAuthors, setCommentAuthors] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"all" | "mentions" | "comments">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    overdue: true,
    due3: true,
    due7: false,
    delegated: false,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<FeedDetailItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTimer, setActiveTimer] = useState(getActiveTaskTimer);

  const load = useCallback(async () => {
    if (!user || !orgId) return;
    setLoading(true);

    const [assigneeRes, directRes, delegatedRes, projectsRes, notifRes] = await Promise.all([
      supabase.from("task_assignees").select("task_id").eq("user_id", user.id),
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assignee_id, project_id, created_by, updated_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url), projects(name)")
        .eq("organization_id", orgId)
        .eq("assignee_id", user.id)
        .is("parent_id", null),
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assignee_id, project_id, created_by, updated_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url), projects(name)")
        .eq("organization_id", orgId)
        .eq("created_by", user.id)
        .neq("assignee_id", user.id)
        .not("assignee_id", "is", null)
        .is("parent_id", null),
      supabase.from("projects").select("id, name").eq("organization_id", orgId).order("name"),
      supabase
        .from("notifications")
        .select("id, type, title, body, entity_id, entity_type, link, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const assigneeTaskIds = (assigneeRes.data ?? []).map((r) => r.task_id);
    let extraTasks: MyTask[] = [];
    if (assigneeTaskIds.length) {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assignee_id, project_id, created_by, updated_at, profiles!tasks_assignee_id_fkey(full_name, avatar_url), projects(name)")
        .eq("organization_id", orgId)
        .in("id", assigneeTaskIds)
        .is("parent_id", null);
      extraTasks = (data ?? []) as unknown as MyTask[];
    }

    const merged = new Map<string, MyTask>();
    for (const t of [
      ...((directRes.data ?? []) as unknown as MyTask[]),
      ...extraTasks,
      ...((delegatedRes.data ?? []) as unknown as MyTask[]),
    ]) {
      merged.set(t.id, t);
    }
    const taskList = [...merged.values()];
    const myTaskIds = taskList.map((t) => t.id);

    let commentRows: CommentRow[] = [];
    const authorMap = new Map<string, string>();
    if (myTaskIds.length) {
      const { data } = await supabase
        .from("task_comments")
        .select("id, task_id, author_id, body, created_at, tasks!inner(id, title, project_id, organization_id, projects(name))")
        .in("task_id", myTaskIds)
        .order("created_at", { ascending: false })
        .limit(40);
      commentRows = (data ?? []) as unknown as CommentRow[];

      const authorIds = [...new Set(commentRows.map((c) => c.author_id))];
      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds);
        for (const p of profiles ?? []) {
          authorMap.set(p.id, p.full_name ?? "Someone");
        }
      }
    }

    setTasks(taskList);
    setProjects(projectsRes.data ?? []);
    setNotifications((notifRes.data ?? []) as Notif[]);
    setComments(commentRows);
    setCommentAuthors(authorMap);
    setLoading(false);
  }, [user, orgId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`my-tasks-dash-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `organization_id=eq.${orgId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, load]);

  useEffect(() => {
    const refresh = () => setActiveTimer(getActiveTaskTimer());
    const unsub = subscribeTaskTimer(refresh);
    const id = setInterval(refresh, 1000);
    return () => { unsub(); clearInterval(id); };
  }, []);

  const taskMeta = useMemo(() => {
    return new Map(tasks.map((t) => [t.id, {
      title: t.title,
      projectId: t.project_id,
      projectName: t.projects?.name ?? null,
    }]));
  }, [tasks]);

  const commentTaskMap = useMemo(() => {
    return new Map(comments.map((c) => [c.id, c.task_id]));
  }, [comments]);

  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);

  const recents = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .slice(0, 8);
  }, [tasks]);

  const myProjects = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of openTasks) {
      if (!t.project_id) continue;
      counts.set(t.project_id, (counts.get(t.project_id) ?? 0) + 1);
    }
    return projects
      .filter((p) => counts.has(p.id))
      .map((p) => ({ ...p, open: counts.get(p.id) ?? 0 }))
      .slice(0, 8);
  }, [projects, openTasks]);

  const overdueTasks = useMemo(() =>
    openTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = startOfDay(parseISO(t.due_date));
      return d < startOfDay(new Date());
    }),
  [openTasks]);

  const dueIn3DaysTasks = useMemo(() =>
    openTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = startOfDay(parseISO(t.due_date));
      const today = startOfDay(new Date());
      const in3 = addDays(today, 3);
      return d >= today && d <= in3;
    }),
  [openTasks]);

  const dueIn7DaysTasks = useMemo(() =>
    openTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = startOfDay(parseISO(t.due_date));
      const today = startOfDay(new Date());
      const after3 = addDays(today, 3);
      const in7 = addDays(today, 7);
      return d > after3 && d <= in7;
    }),
  [openTasks]);

  const delegatedTasks = useMemo(() =>
    tasks.filter((t) =>
      t.created_by === user?.id
      && t.assignee_id
      && t.assignee_id !== user?.id
      && t.status !== "done",
    ),
  [tasks, user?.id]);

  const assignedGroups = useMemo(() => {
    const order = ["in_progress", "todo", "review", "blocked"];
    return order
      .map((status) => ({
        status,
        tasks: openTasks.filter((t) => t.status === status),
      }))
      .filter((g) => g.tasks.length > 0);
  }, [openTasks]);

  const feedItems = useMemo(() => {
    const items: FeedDetailItem[] = [];

    for (const n of notifications) {
      const isMention = n.type.includes("mention") || n.title.toLowerCase().includes("mention");
      if (!isMention) continue;
      const taskId = parseTaskIdFromNotif(n, commentTaskMap);
      if (!taskId) continue;
      const meta = taskMeta.get(taskId);
      const fromComment = n.entity_type === "task_comment" && n.entity_id
        ? comments.find((c) => c.id === n.entity_id)
        : null;
      items.push({
        id: `mention-${n.id}`,
        kind: "mention",
        title: n.title,
        createdAt: n.created_at,
        taskId,
        taskTitle: fromComment?.tasks.title ?? meta?.title ?? "Task",
        projectId: fromComment?.tasks.project_id ?? meta?.projectId ?? null,
        projectName: fromComment?.tasks.projects?.name ?? meta?.projectName ?? null,
        body: n.body,
      });
    }

    for (const c of comments) {
      const author = commentAuthors.get(c.author_id) ?? "Someone";
      items.push({
        id: `comment-${c.id}`,
        kind: "comment",
        title: `${author} commented`,
        createdAt: c.created_at,
        taskId: c.task_id,
        taskTitle: c.tasks.title,
        projectId: c.tasks.project_id,
        projectName: c.tasks.projects?.name ?? null,
        body: getCommentDisplayText(stripHtml(c.body)),
      });
    }

    const filtered = items.filter((item) => {
      if (feedTab === "mentions") return item.kind === "mention";
      if (feedTab === "comments") return item.kind === "comment";
      return true;
    });

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, comments, commentAuthors, commentTaskMap, taskMeta, feedTab]);

  async function toggleComplete(task: MyTask, e?: MouseEvent) {
    e?.stopPropagation();
    const next = task.status === "done" ? "todo" : "done";
    await supabase.from("tasks").update({ status: next, completion_percent: next === "done" ? 100 : 0 }).eq("id", task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
  }

  function openTask(taskId: string) {
    setSelectedTaskId(taskId);
  }

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  if (loading || !orgId || !user) {
    return (
      <AppShell title="My Tasks">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Welcome back, ${firstName}!`}
      subtitle="My Tasks"
      actions={
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:brightness-110"
        >
          <Plus className="size-3.5" />
          Create Task
        </button>
      }
    >
      <div className="space-y-4 -mt-1">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <SummaryCard title="Recents" bodyClassName={SCROLL_SM}>
            {recents.length === 0 ? (
              <EmptyHint text="No recent tasks." />
            ) : (
              recents.map((t) => (
                <TaskLine key={t.id} title={t.title} projectName={t.projects?.name} onClick={() => openTask(t.id)} />
              ))
            )}
          </SummaryCard>

          <SummaryCard
            title="My projects"
            action={<Link to="/projects" className="text-[11px] text-brand hover:underline">All</Link>}
            bodyClassName={SCROLL_SM}
          >
            {myProjects.length === 0 ? (
              <EmptyHint text="No active projects." />
            ) : (
              myProjects.map((p) => (
                <ProjectLine
                  key={p.id}
                  name={p.name}
                  suffix={`${p.open} open`}
                  onClick={() => {
                    const first = openTasks.find((t) => t.project_id === p.id);
                    if (first) openTask(first.id);
                  }}
                />
              ))
            )}
          </SummaryCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
          <div className={COLUMN_STACK}>
            <SummaryCard
              title="Needs attention"
              action={<span className="text-[10px] text-muted-foreground">Overdue · upcoming · delegated</span>}
              bodyClassName={SCROLL_PANEL}
              fill
            >
              <WorkSection title="Overdue" count={overdueTasks.length} open={expanded.overdue} onToggle={() => toggleSection("overdue")}>
                {overdueTasks.map((t) => (
                  <WorkTaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} onToggle={(e) => toggleComplete(t, e)} />
                ))}
              </WorkSection>
              <WorkSection title="Due in 3 days" count={dueIn3DaysTasks.length} open={expanded.due3} onToggle={() => toggleSection("due3")}>
                {dueIn3DaysTasks.map((t) => (
                  <WorkTaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} onToggle={(e) => toggleComplete(t, e)} />
                ))}
              </WorkSection>
              <WorkSection title="Due in 7 days" count={dueIn7DaysTasks.length} open={expanded.due7} onToggle={() => toggleSection("due7")}>
                {dueIn7DaysTasks.map((t) => (
                  <WorkTaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} onToggle={(e) => toggleComplete(t, e)} />
                ))}
              </WorkSection>
              <WorkSection title="Delegated" count={delegatedTasks.length} open={expanded.delegated} onToggle={() => toggleSection("delegated")}>
                {delegatedTasks.map((t) => (
                  <WorkTaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} onToggle={(e) => toggleComplete(t, e)} />
                ))}
              </WorkSection>
            </SummaryCard>

            <SummaryCard
              title="Comments & Mentions"
              action={
                <div className="flex gap-0.5">
                  {(["all", "mentions", "comments"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFeedTab(tab)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                        feedTab === tab ? "bg-brand/10 text-brand" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              }
              bodyClassName={SCROLL_PANEL}
              fill
            >
              {feedItems.length === 0 ? (
                <EmptyHint text={feedTab === "comments" ? "No comments yet." : feedTab === "mentions" ? "No mentions yet." : "Nothing here yet."} />
              ) : (
                feedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFeed(item)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2/50"
                  >
                    <Circle className="size-2.5 shrink-0 text-muted-foreground/50" />
                    <span className="min-w-0 truncate text-xs text-foreground">{item.title}</span>
                  </button>
                ))
              )}
            </SummaryCard>
          </div>

          <SummaryCard title="Assigned to me" bodyClassName={SCROLL_PANEL} fill className="xl:h-[30rem]">
            {assignedGroups.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs font-medium text-foreground">No tasks assigned</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Create a task or wait for assignments.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-brand-foreground"
                >
                  <Plus className="size-3" /> Create Task
                </button>
              </div>
            ) : (
              assignedGroups.map((group) => (
                <div key={group.status}>
                  <div className="flex items-center gap-1.5 bg-surface/40 px-3 py-1.5">
                    <span className={cn(
                      "rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
                      TASK_STATUS_PILL[group.status] ?? TASK_STATUS_PILL.todo,
                    )}>
                      {getTaskStatusMeta(group.status).label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{group.tasks.length}</span>
                  </div>
                  {group.tasks.map((t) => (
                    <TaskLine
                      key={t.id}
                      title={t.title}
                      projectName={t.projects?.name}
                      onClick={() => openTask(t.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </SummaryCard>
        </div>
      </div>

      {activeTimer && (
        <button
          type="button"
          onClick={() => openTask(activeTimer.taskId)}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-lg hover:brightness-110"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-foreground/40" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-foreground" />
          </span>
          View tracked task · {formatTimerSeconds(
            activeTimer.elapsedBefore + Math.floor((Date.now() - activeTimer.startedAt) / 1000),
          )}
        </button>
      )}

      <TaskPreviewModal
        taskId={selectedTaskId}
        open={Boolean(selectedTaskId)}
        onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}
        onTaskChange={setSelectedTaskId}
        onUpdated={load}
      />

      <FeedDetailModal
        item={selectedFeed}
        open={Boolean(selectedFeed)}
        onOpenChange={(open) => { if (!open) setSelectedFeed(null); }}
        onOpenTask={openTask}
      />

      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        orgId={orgId}
        userId={user.id}
        onSuccess={load}
      />
    </AppShell>
  );
}

function SummaryCard({
  title,
  action,
  children,
  bodyClassName,
  fill = false,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <section className={cn(
      "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
      fill && "min-h-0 flex-1",
      className,
    )}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold">{title}</h2>
        {action}
      </div>
      <div className={cn("min-h-0 divide-y divide-border", bodyClassName)}>{children}</div>
    </section>
  );
}

function TaskLine({
  title,
  projectName,
  onClick,
}: {
  title: string;
  projectName?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2/50"
    >
      <Circle className="size-2.5 shrink-0 text-muted-foreground/50" />
      <p className="min-w-0 truncate text-xs leading-snug">
        <span className="text-foreground">{title}</span>
        {projectName ? (
          <span className="text-muted-foreground"> in {projectName}</span>
        ) : (
          <span className="text-muted-foreground"> · No project</span>
        )}
      </p>
    </button>
  );
}

function ProjectLine({
  name,
  suffix,
  onClick,
}: {
  name: string;
  suffix: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2/50"
    >
      <Circle className="size-2.5 shrink-0 text-muted-foreground/50" />
      <p className="min-w-0 truncate text-xs leading-snug">
        <span className="text-foreground">{name}</span>
        <span className="text-muted-foreground"> · {suffix}</span>
      </p>
    </button>
  );
}

function WorkSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left hover:bg-surface-2/40"
      >
        {open ? <ChevronDown className="size-3 text-muted-foreground" /> : <ChevronRight className="size-3 text-muted-foreground" />}
        <span className="text-xs font-medium">{title}</span>
        <span className="text-[10px] text-muted-foreground">({count})</span>
      </button>
      {open && (
        count > 0 ? <div>{children}</div> : (
          <p className="px-3 pb-2 text-[11px] text-muted-foreground">No tasks</p>
        )
      )}
    </div>
  );
}

function WorkTaskRow({
  task,
  onOpen,
  onToggle,
}: {
  task: MyTask;
  onOpen: () => void;
  onToggle: (e: MouseEvent) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-surface-2/40">
      <button type="button" onClick={onToggle} className="shrink-0 text-muted-foreground/60 hover:text-brand">
        <Circle className="size-2.5" />
      </button>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="truncate text-xs leading-snug">
          <span className="text-foreground">{task.title}</span>
          {task.projects?.name ? (
            <span className="text-muted-foreground"> in {task.projects.name}</span>
          ) : (
            <span className="text-muted-foreground"> · No project</span>
          )}
        </p>
      </button>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-3 py-5 text-[11px] text-muted-foreground">{text}</p>;
}
