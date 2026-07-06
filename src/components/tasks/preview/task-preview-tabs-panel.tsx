import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { endOfMonth, endOfWeek, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { CommentComposer } from "@/components/tasks/details/comment-composer";
import {
  buildTaskActivityItems,
  formatActivityTimestamp,
  type TaskActivityItem,
} from "@/components/tasks/details/task-activity-feed";
import { TaskDetailsWorkers } from "@/components/tasks/details/task-details-workers";
import { TaskPreviewChecklist } from "@/components/tasks/preview/task-preview-checklist";
import { TaskPreviewCommentCard } from "@/components/tasks/preview/task-preview-comment-card";
import { TaskPreviewSubtasks } from "@/components/tasks/preview/task-preview-subtasks";
import { TaskPreviewTimeCard } from "@/components/tasks/preview/task-preview-time-card";
import { TaskPreviewTimeDetails } from "@/components/tasks/preview/task-preview-time-details";
import {
  previewActivityRow,
  previewSegmentedButton,
  previewSegmentedControl,
  previewTabContent,
  previewTabList,
  previewTabTrigger,
} from "@/components/tasks/preview/task-preview-styles";
import type { CommentAttachment } from "@/lib/tasks/comment-attachments";
import type { TaskPreviewAudit } from "@/components/tasks/preview/use-task-preview-data";
import { countRootComments, type TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskChecklistItem } from "@/lib/tasks/checklist";
import { buildWorkerRows } from "@/lib/tasks/time-aggregates";
import type {
  TaskDetailProfile,
  TaskDetailRecord,
  TaskListItem,
  TaskOrgMember,
  TaskTimeEntry,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewTabsPanelProps = {
  task: TaskDetailRecord;
  orgId: string;
  userId: string;
  members: TaskOrgMember[];
  subtasks: TaskListItem[];
  checklistItems: TaskChecklistItem[];
  comments: TaskCommentNode[];
  audits: TaskPreviewAudit[];
  timeEntries: TaskTimeEntry[];
  profiles: TaskDetailProfile[];
  assigneeIds: string[];
  trackedTotal: number;
  isTracking: boolean;
  sessionTime: number;
  isAssignee: boolean;
  timerStartBlocked: boolean;
  currentUserId?: string;
  canModerate?: boolean;
  nameOf: (id: string | null | undefined) => string;
  onOpenTask: (id: string) => void;
  onReload: () => void;
  onToggleTimer: () => void;
  onAddChecklistItem: (title: string, assigneeId: string | null) => Promise<void>;
  onToggleChecklistItem: (item: TaskChecklistItem) => void;
  onRemoveChecklistItem: (item: TaskChecklistItem) => void;
  onAssignChecklistItem: (item: TaskChecklistItem, assigneeId: string | null) => void;
  onCommentSubmit?: (body: string, parentId?: string | null) => Promise<void>;
  onCommentUpdate?: (id: string, body: string) => Promise<void>;
  onCommentDelete?: (id: string) => Promise<void>;
  onUploadCommentAttachments?: (files: File[]) => Promise<CommentAttachment[]>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  subtaskCreateTrigger?: number;
};

const ACTIVITY_PREVIEW_COUNT = 8;

type ActivityPeriod = "all" | "week" | "month";

function filterActivityByPeriod(items: TaskActivityItem[], period: ActivityPeriod) {
  if (period === "all") return items;
  const now = new Date();
  const interval = period === "week"
    ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    : { start: startOfMonth(now), end: endOfMonth(now) };

  return items.filter((item) => isWithinInterval(new Date(item.at), interval));
}

function ActivityFeedList({ items }: { items: TaskActivityItem[] }) {
  const [period, setPeriod] = useState<ActivityPeriod>("week");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () => filterActivityByPeriod(items, period),
    [items, period],
  );

  useEffect(() => {
    setExpanded(false);
  }, [items, period]);

  const visible = expanded ? filtered : filtered.slice(0, ACTIVITY_PREVIEW_COUNT);
  const hiddenCount = Math.max(0, filtered.length - ACTIVITY_PREVIEW_COUNT);

  return (
    <div>
      <div className="mb-3">
        <div className={previewSegmentedControl} role="tablist" aria-label="Activity period">
          {([
            ["all", "All"],
            ["week", "This week"],
            ["month", "This month"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={period === value}
              data-active={period === value}
              onClick={() => setPeriod(value)}
              className={previewSegmentedButton}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          {items.length === 0 ? "No activity yet" : "No activity in this period"}
        </p>
      ) : (
        <>
          <ul className="space-y-0.5">
            {visible.map((item) => (
              <li key={item.id}>
                <ActivityRow item={item} />
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface/60 hover:text-brand"
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  Show more
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: TaskActivityItem }) {
  return (
    <div className={previewActivityRow}>
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/35" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground/90">{item.text}</p>
        {item.detail && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">{item.detail}</p>
        )}
      </div>
      <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
        {formatActivityTimestamp(item.at)}
      </time>
    </div>
  );
}

export function TaskPreviewTabsPanel({
  task,
  orgId,
  userId,
  members,
  subtasks,
  checklistItems,
  comments,
  audits,
  timeEntries,
  profiles,
  assigneeIds,
  trackedTotal,
  isTracking,
  sessionTime,
  isAssignee,
  timerStartBlocked,
  currentUserId,
  canModerate,
  nameOf,
  onOpenTask,
  onReload,
  onToggleTimer,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onAssignChecklistItem,
  onCommentSubmit,
  onCommentUpdate,
  onCommentDelete,
  onUploadCommentAttachments,
  activeTab,
  onTabChange,
  subtaskCreateTrigger = 0,
}: TaskPreviewTabsPanelProps) {
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [createChecklistOpen, setCreateChecklistOpen] = useState(false);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());
  const [replyingToRootId, setReplyingToRootId] = useState<string | null>(null);

  const rootCommentCount = useMemo(() => countRootComments(comments), [comments]);

  const sortedRoots = useMemo(
    () => [...comments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
    [comments],
  );

  const activityFeed = useMemo(
    () => buildTaskActivityItems({
      timeEntries,
      comments: comments.map(({ replies: _replies, ...record }) => record),
      audits,
      nameOf,
      sortDescending: true,
    }),
    [timeEntries, comments, audits, nameOf],
  );

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const workers = useMemo(
    () => buildWorkerRows(
      timeEntries,
      profileMap,
      assigneeIds,
      isTracking && currentUserId
        ? { userId: currentUserId, seconds: sessionTime }
        : undefined,
    ),
    [timeEntries, profileMap, assigneeIds, isTracking, currentUserId, sessionTime],
  );

  const showComments = Boolean(onCommentSubmit && onCommentUpdate && onCommentDelete);
  const defaultTab = task.parent_id ? (showComments ? "comments" : "activities") : "subtasks";
  const tabValue = activeTab ?? defaultTab;
  const checklistDone = checklistItems.filter((i) => i.is_completed).length;

  useEffect(() => {
    if (subtaskCreateTrigger > 0) setCreateSubtaskOpen(true);
  }, [subtaskCreateTrigger]);

  function toggleReplies(rootId: string) {
    setExpandedRoots((current) => {
      const next = new Set(current);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });
  }

  function openReply(rootId: string) {
    setExpandedRoots((current) => new Set(current).add(rootId));
    setReplyingToRootId(rootId);
  }

  return (
    <TabsPrimitive.Root
      value={tabValue}
      onValueChange={onTabChange}
      className="flex flex-col"
    >
      <TabsPrimitive.List className={previewTabList}>
        {!task.parent_id && (
          <TabsPrimitive.Trigger value="subtasks" className={previewTabTrigger}>
            Subtasks
            {subtasks.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/70">{subtasks.length}</span>
            )}
          </TabsPrimitive.Trigger>
        )}
        {!task.parent_id && (
          <TabsPrimitive.Trigger value="checklist" className={previewTabTrigger}>
            Checklist
            {checklistItems.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/70">
                {checklistDone}/{checklistItems.length}
              </span>
            )}
          </TabsPrimitive.Trigger>
        )}
        {showComments && (
          <TabsPrimitive.Trigger value="comments" className={previewTabTrigger}>
            Comments
            {rootCommentCount > 0 && (
              <span className="ml-1.5 text-muted-foreground/70">{rootCommentCount}</span>
            )}
          </TabsPrimitive.Trigger>
        )}
        <TabsPrimitive.Trigger value="activities" className={previewTabTrigger}>
          Activities
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger value="time" className={previewTabTrigger}>
          Time tracking
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>

        {!task.parent_id && (
          <TabsPrimitive.Content value="subtasks" className={previewTabContent}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">Break work into smaller pieces</p>
              <button
                type="button"
                onClick={() => setCreateSubtaskOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Plus className="size-3.5" />
                Add subtask
              </button>
            </div>
            <TaskPreviewSubtasks
              parentTask={task}
              subtasks={subtasks}
              orgId={orgId}
              userId={userId}
              members={members}
              onChange={onReload}
              onOpenTask={onOpenTask}
              createOpen={createSubtaskOpen}
              onCreateOpenChange={setCreateSubtaskOpen}
            />
          </TabsPrimitive.Content>
        )}

        {!task.parent_id && (
          <TabsPrimitive.Content value="checklist" className={previewTabContent}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">
                {checklistItems.length > 0
                  ? `${checklistDone} of ${checklistItems.length} completed`
                  : "Track smaller steps within this task"}
              </p>
              <button
                type="button"
                onClick={() => setCreateChecklistOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Plus className="size-3.5" />
                Add item
              </button>
            </div>
            <TaskPreviewChecklist
              items={checklistItems}
              members={members}
              createOpen={createChecklistOpen}
              onCreateOpenChange={setCreateChecklistOpen}
              onToggle={onToggleChecklistItem}
              onDelete={onRemoveChecklistItem}
              onAdd={onAddChecklistItem}
              onAssigneeChange={onAssignChecklistItem}
            />
          </TabsPrimitive.Content>
        )}

        {showComments && (
          <TabsPrimitive.Content value="comments" className={previewTabContent}>
            <CommentComposer
              members={members}
              layout="modal"
              placeholder="Write a comment…"
              submitLabel="Publish"
              enableAttachments={Boolean(onUploadCommentAttachments)}
              onUploadAttachments={onUploadCommentAttachments}
              onSubmit={(body) => onCommentSubmit!(body)}
              className="mb-5"
            />

            {sortedRoots.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {sortedRoots.map((root) => {
                  const expanded = expandedRoots.has(root.id);
                  const showReplyComposer = replyingToRootId === root.id;

                  return (
                    <div key={root.id}>
                      <TaskPreviewCommentCard
                        comment={root}
                        members={members}
                        currentUserId={currentUserId}
                        canModerate={canModerate}
                        repliesExpanded={expanded}
                        replyCount={root.replies.length}
                        variant="modal"
                        onToggleReplies={
                          root.replies.length > 0 ? () => toggleReplies(root.id) : undefined
                        }
                        onReply={() => openReply(root.id)}
                        onUpdate={onCommentUpdate}
                        onDelete={onCommentDelete}
                      />

                      {expanded && root.replies.length > 0 && (
                        <div className="mt-3 space-y-3 border-l-2 border-border/40 pl-4 ml-4">
                          {root.replies.map((reply) => (
                            <TaskPreviewCommentCard
                              key={reply.id}
                              comment={reply}
                              members={members}
                              currentUserId={currentUserId}
                              canModerate={canModerate}
                              variant="modal-reply"
                              showReplyMeta={false}
                              onUpdate={onCommentUpdate}
                              onDelete={onCommentDelete}
                            />
                          ))}
                        </div>
                      )}

                      {showReplyComposer && (
                        <div className="mt-3 ml-4">
                          <CommentComposer
                            members={members}
                            layout="modal"
                            compact
                            autoFocus
                            placeholder="Reply to comment…"
                            submitLabel="Publish"
                            enableAttachments={Boolean(onUploadCommentAttachments)}
                            onUploadAttachments={onUploadCommentAttachments}
                            onCancel={() => setReplyingToRootId(null)}
                            onSubmit={async (body) => {
                              await onCommentSubmit!(body, root.id);
                              setReplyingToRootId(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsPrimitive.Content>
        )}

        <TabsPrimitive.Content value="activities" className={previewTabContent}>
          <ActivityFeedList items={activityFeed} />
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="time" className={previewTabContent}>
          <div className="space-y-5">
            <TaskPreviewTimeCard
              totalSeconds={trackedTotal}
              isTracking={isTracking}
              sessionSeconds={sessionTime}
              isAssignee={isAssignee}
              timerStartBlocked={timerStartBlocked}
              onToggleTimer={onToggleTimer}
            />
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Time by person
              </p>
              <TaskDetailsWorkers workers={workers} bare />
            </div>
            <TaskPreviewTimeDetails
              taskId={task.id}
              timeEntries={timeEntries}
              profiles={profiles}
              assigneeIds={assigneeIds}
              isTracking={isTracking}
              sessionTime={sessionTime}
              currentUserId={currentUserId}
              omitWorkers
            />
          </div>
        </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}
