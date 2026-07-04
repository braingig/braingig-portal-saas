import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { CommentComposer } from "@/components/tasks/details/comment-composer";
import { TaskPreviewCommentCard } from "@/components/tasks/preview/task-preview-comment-card";
import { countReplyComments, countRootComments, type TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskPreviewCommentsViewProps = {
  comments: TaskCommentNode[];
  initialExpandedRootId?: string;
  initialReplyToRootId?: string;
  members: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  canReply?: boolean;
  onBack: () => void;
  onSubmit: (body: string, parentId?: string | null) => Promise<void>;
  onUpdate: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

export function TaskPreviewCommentsView({
  comments,
  initialExpandedRootId,
  initialReplyToRootId,
  members,
  currentUserId,
  canModerate,
  canReply = true,
  onBack,
  onSubmit,
  onUpdate,
  onDelete,
}: TaskPreviewCommentsViewProps) {
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(() => (
    initialExpandedRootId ? new Set([initialExpandedRootId]) : new Set()
  ));
  const [replyingToRootId, setReplyingToRootId] = useState<string | null>(
    initialReplyToRootId ?? null,
  );

  useEffect(() => {
    if (initialExpandedRootId) {
      setExpandedRoots(new Set([initialExpandedRootId]));
    } else {
      setExpandedRoots(new Set());
    }
    setReplyingToRootId(initialReplyToRootId ?? null);
  }, [initialExpandedRootId, initialReplyToRootId]);

  const sortedRoots = useMemo(
    () => [...comments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
    [comments],
  );

  const rootCount = useMemo(() => countRootComments(comments), [comments]);
  const replyCount = useMemo(() => countReplyComments(comments), [comments]);

  const headerLabel = replyCount > 0
    ? `${rootCount} ${rootCount === 1 ? "comment" : "comments"} · ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
    : `${rootCount} ${rootCount === 1 ? "comment" : "comments"}`;

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
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] text-muted-foreground hover:bg-surface/80 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <span className="truncate text-[13px] text-foreground">
          {headerLabel}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {sortedRoots.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No comments yet</p>
        ) : (
          <div className="space-y-3">
            {sortedRoots.map((root) => {
              const expanded = expandedRoots.has(root.id);
              const showReplyComposer = canReply && replyingToRootId === root.id;

              return (
                <div key={root.id}>
                  <TaskPreviewCommentCard
                    comment={root}
                    members={members}
                    currentUserId={currentUserId}
                    canModerate={canModerate}
                    repliesExpanded={expanded}
                    replyCount={root.replies.length}
                    onToggleReplies={
                      root.replies.length > 0 ? () => toggleReplies(root.id) : undefined
                    }
                    onReply={() => openReply(root.id)}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />

                  {expanded && root.replies.length > 0 && (
                    <div className="mt-2 space-y-2 border-l border-border/50 pl-3 ml-3">
                      {root.replies.map((reply) => (
                        <TaskPreviewCommentCard
                          key={reply.id}
                          comment={reply}
                          members={members}
                          currentUserId={currentUserId}
                          canModerate={canModerate}
                          variant="reply"
                          showReplyMeta={false}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  )}

                  {showReplyComposer && (
                    <div className="mt-2 ml-3">
                      <CommentComposer
                        members={members}
                        layout="clickup"
                        compact
                        autoFocus
                        placeholder="Reply to comment…"
                        onCancel={() => setReplyingToRootId(null)}
                        onSubmit={async (body) => {
                          await onSubmit(body, root.id);
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
      </div>

      {canReply && (
        <div className="shrink-0 border-t border-border/40 bg-card/50 p-3">
          <CommentComposer
            members={members}
            layout="clickup"
            compact
            placeholder="Write a comment…"
            onSubmit={(body) => onSubmit(body)}
          />
        </div>
      )}
    </>
  );
}
