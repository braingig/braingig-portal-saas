import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  buildTaskActivityItems,
  formatActivityTimestamp,
  type TaskActivityItem,
} from "@/components/tasks/details/task-activity-feed";
import { CommentComposer } from "@/components/tasks/details/comment-composer";
import { TaskPreviewCommentPreview } from "@/components/tasks/preview/task-preview-comment-preview";
import { TaskPreviewCommentsView } from "@/components/tasks/preview/task-preview-comments-view";
import { countRootComments, getLatestThreadActivity, type TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskPreviewAudit } from "@/components/tasks/preview/use-task-preview-data";
import type { TaskOrgMember, TaskTimeEntry } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewActivityPanelProps = {
  timeEntries: TaskTimeEntry[];
  comments: TaskCommentNode[];
  audits: TaskPreviewAudit[];
  nameOf: (id: string | null | undefined) => string;
  className?: string;
  mentionMembers?: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  onCommentSubmit?: (body: string, parentId?: string | null) => Promise<void>;
  onCommentUpdate?: (id: string, body: string) => Promise<void>;
  onCommentDelete?: (id: string) => Promise<void>;
};

const PREVIEW_COUNT = 3;

type CommentsNav = {
  expandedRootId?: string;
  replyToRootId?: string;
} | null;

function commentIdFromItem(item: TaskActivityItem): string | null {
  if (!item.id.startsWith("comment-")) return null;
  return item.id.slice("comment-".length);
}

function ActivityRow({
  item,
  onOpenComment,
}: {
  item: TaskActivityItem;
  onOpenComment?: (commentId: string) => void;
}) {
  const commentId = commentIdFromItem(item);
  const content = (
    <>
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-[13px] leading-snug text-foreground/90">{item.text}</p>
        {item.detail && (
          <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{item.detail}</p>
        )}
      </div>
      <time className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
        {formatActivityTimestamp(item.at)}
      </time>
    </>
  );

  if (commentId && onOpenComment) {
    return (
      <button
        type="button"
        onClick={() => onOpenComment(commentId)}
        className="flex w-full gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-surface/60"
      >
        {content}
      </button>
    );
  }

  return <div className="flex gap-2 px-1">{content}</div>;
}

export function TaskPreviewActivityPanel({
  timeEntries,
  comments,
  audits,
  nameOf,
  className,
  mentionMembers = [],
  currentUserId,
  canModerate,
  onCommentSubmit,
  onCommentUpdate,
  onCommentDelete,
}: TaskPreviewActivityPanelProps) {
  const [commentsNav, setCommentsNav] = useState<CommentsNav>(null);
  const [expanded, setExpanded] = useState(false);

  const latestThread = useMemo(() => getLatestThreadActivity(comments), [comments]);
  const latestPreview = latestThread?.latest ?? null;
  const latestThreadRootId = latestThread?.root.id ?? null;

  const rootCommentCount = useMemo(() => countRootComments(comments), [comments]);

  const feed = useMemo(() => {
    const replyCountById = new Map(comments.map((c) => [c.id, c.replies.length]));
    const roots = comments
      .filter((c) => c.id !== latestThreadRootId)
      .map(({ replies: _replies, ...record }) => record);
    const items = buildTaskActivityItems({
      timeEntries,
      comments: roots,
      audits,
      nameOf,
      sortDescending: true,
    });

    return items.map((item) => {
      const commentId = commentIdFromItem(item);
      if (!commentId) return item;
      const replies = replyCountById.get(commentId) ?? 0;
      if (replies === 0) return item;
      return {
        ...item,
        detail: `${replies} ${replies === 1 ? "reply" : "replies"}`,
      };
    });
  }, [timeEntries, comments, audits, nameOf, latestThreadRootId]);

  useEffect(() => {
    setExpanded(false);
  }, [timeEntries, comments, audits]);

  const showComments = Boolean(
    onCommentSubmit && onCommentUpdate && onCommentDelete,
  );

  const visible = expanded ? feed : feed.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(0, feed.length - PREVIEW_COUNT);

  if (commentsNav) {
    return (
      <aside className={cn(
        "flex w-full shrink-0 flex-col border-t border-border/40 bg-surface/20 lg:w-80 lg:max-w-[min(28%,22rem)] lg:border-l lg:border-t-0",
        className,
      )}>
        <TaskPreviewCommentsView
          comments={comments}
          initialExpandedRootId={commentsNav.expandedRootId}
          initialReplyToRootId={commentsNav.replyToRootId}
          members={mentionMembers}
          currentUserId={currentUserId}
          canModerate={canModerate}
          onBack={() => setCommentsNav(null)}
          onSubmit={onCommentSubmit ?? (async () => {})}
          onUpdate={onCommentUpdate ?? (async () => {})}
          onDelete={onCommentDelete ?? (async () => {})}
          canReply={showComments}
        />
      </aside>
    );
  }

  return (
    <aside className={cn(
      "flex w-full shrink-0 flex-col border-t border-border/40 bg-surface/20 lg:w-80 lg:max-w-[min(28%,22rem)] lg:border-l lg:border-t-0",
      className,
    )}>
      <div className="flex shrink-0 items-center border-b border-border/40 px-4 py-3">
        <h3 className="text-[13px] font-normal text-muted-foreground">Activity</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {feed.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No activity yet</p>
        ) : (
          <>
            <ul className="space-y-3">
              {visible.map((item) => (
                <li key={item.id}>
                  <ActivityRow
                    item={item}
                    onOpenComment={(id) => setCommentsNav({})}
                  />
                </li>
              ))}
            </ul>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-brand"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="size-3.5" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" />
                    Show more ({feed.length})
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {(latestPreview && latestThread) || showComments ? (
        <div className="shrink-0 border-t border-border/40 bg-card/50 p-3">
          {latestPreview && latestThread && (
            <TaskPreviewCommentPreview
              comment={latestPreview}
              threadRoot={latestThread.root}
              totalComments={rootCommentCount}
              members={mentionMembers}
              onOpenComments={() => setCommentsNav({})}
              onOpenReplies={() => setCommentsNav(
                latestThread.root.replies.length > 0
                  ? { expandedRootId: latestThread.root.id }
                  : { expandedRootId: latestThread.root.id, replyToRootId: latestThread.root.id },
              )}
              className={showComments ? "mb-3" : undefined}
            />
          )}
          {showComments && (
            <CommentComposer
              members={mentionMembers}
              layout="clickup"
              compact
              placeholder="Write a comment…"
              onSubmit={(body) => onCommentSubmit!(body)}
            />
          )}
        </div>
      ) : null}
    </aside>
  );
}
