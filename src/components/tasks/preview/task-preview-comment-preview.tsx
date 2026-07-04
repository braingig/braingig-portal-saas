import { MessageSquare } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { CommentBody } from "@/components/tasks/details/comment-body";
import { formatActivityTimestamp } from "@/components/tasks/details/task-activity-feed";
import type { TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewCommentPreviewProps = {
  comment: TaskCommentNode;
  threadRoot: TaskCommentNode;
  totalComments: number;
  members: TaskOrgMember[];
  onOpenComments: () => void;
  onOpenReplies: () => void;
  className?: string;
};

export function TaskPreviewCommentPreview({
  comment,
  threadRoot,
  totalComments,
  members,
  onOpenComments,
  onOpenReplies,
  className,
}: TaskPreviewCommentPreviewProps) {
  const author = comment.author ?? threadRoot.author;
  const replyCount = threadRoot.replies.length;

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border/60 bg-card text-left shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenComments}
        className="w-full rounded-t-lg px-3 pt-2.5 text-left transition-colors hover:bg-surface/40"
      >
        <div className="mb-2 flex items-start gap-2">
          <ProfileAvatar
            userId={comment.author_id}
            name={author?.full_name}
            avatarUrl={author?.avatar_url}
            email={author?.email}
            size="xs"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13px] font-medium text-foreground">
                {author?.full_name || "Member"}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatActivityTimestamp(comment.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="line-clamp-2 pb-2.5 text-[13px] leading-snug text-foreground/90">
          <CommentBody body={comment.body} members={members} />
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-border/40 px-3 py-2">
        <button
          type="button"
          onClick={onOpenComments}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-brand"
        >
          <MessageSquare className="size-3.5 shrink-0" />
          {totalComments} {totalComments === 1 ? "comment" : "comments"}
        </button>
        <button
          type="button"
          onClick={onOpenReplies}
          className="inline-flex items-center gap-1.5 text-[12px] text-brand hover:underline"
        >
          {replyCount > 0 && (
            <span className="flex -space-x-1">
              {threadRoot.replies.slice(0, 3).map((reply) => (
                <ProfileAvatar
                  key={reply.id}
                  userId={reply.author_id}
                  name={reply.author?.full_name}
                  avatarUrl={reply.author?.avatar_url}
                  email={reply.author?.email}
                  size="xs"
                  className="ring-1 ring-card"
                />
              ))}
            </span>
          )}
          {replyCount === 0 ? "Reply" : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
        </button>
      </div>
    </div>
  );
}
