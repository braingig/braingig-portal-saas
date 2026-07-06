import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { CommentBody } from "@/components/tasks/details/comment-body";
import { formatActivityTimestamp } from "@/components/tasks/details/task-activity-feed";
import {
  getCommentDisplayText,
  parseCommentAttachments,
  serializeCommentBody,
} from "@/lib/tasks/comment-attachments";
import {
  previewCommentCard,
  previewDropdown,
  previewMenuItem,
  previewMenuItemDanger,
} from "@/components/tasks/preview/task-preview-styles";
import type { TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewCommentCardProps = {
  comment: TaskCommentNode;
  members: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  variant?: "default" | "reply" | "modal" | "modal-reply";
  showReplyMeta?: boolean;
  showActions?: boolean;
  repliesExpanded?: boolean;
  replyCount?: number;
  onToggleReplies?: () => void;
  onReply?: () => void;
  onUpdate?: (commentId: string, body: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  className?: string;
};

function wasEdited(createdAt: string, updatedAt: string) {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
}

export function TaskPreviewCommentCard({
  comment,
  members,
  currentUserId,
  canModerate,
  variant = "default",
  showReplyMeta = true,
  showActions = true,
  repliesExpanded = false,
  replyCount: replyCountProp,
  onToggleReplies,
  onReply,
  onUpdate,
  onDelete,
  className,
}: TaskPreviewCommentCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(getCommentDisplayText(comment.body));
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const author = comment.author;
  const isAuthor = currentUserId === comment.author_id;
  const canEdit = isAuthor;
  const canDelete = isAuthor || canModerate;
  const edited = wasEdited(comment.created_at, comment.updated_at);
  const replyCount = replyCountProp ?? comment.replies.length;
  const isReply = variant === "reply" || variant === "modal-reply";
  const isModal = variant === "modal" || variant === "modal-reply";

  useEffect(() => {
    if (!editing) setEditText(getCommentDisplayText(comment.body));
  }, [comment.body, editing]);

  async function handleSaveEdit() {
    const { attachments } = parseCommentAttachments(comment.body);
    if ((!editText.trim() && attachments.length === 0) || saving || !onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, serializeCommentBody(editText.trim(), attachments));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(comment.id);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className={cn(
      isModal
        ? isReply
          ? "rounded-md border border-border/40 bg-surface/25 px-2.5 py-2"
          : previewCommentCard
        : isReply
          ? "rounded-md border border-border/40 bg-surface/30"
          : "rounded-lg border border-border/60 bg-card shadow-sm",
      className,
    )}>
      <div className={cn(isModal ? "px-0 pt-0" : "px-3 pt-2.5")}>
        <div className="mb-2 flex items-start gap-2.5">
          <ProfileAvatar
            userId={comment.author_id}
            name={author?.full_name}
            avatarUrl={author?.avatar_url}
            email={author?.email}
            size={isModal ? "sm" : "xs"}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-foreground">
                {author?.full_name || "Member"}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatActivityTimestamp(comment.created_at)}
                {edited && " · edited"}
              </span>
            </div>
          </div>
          {showActions && onUpdate && onDelete && (canEdit || canDelete) && !editing && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-surface/80"
                  aria-label="Comment actions"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={previewDropdown} onCloseAutoFocus={(e) => e.preventDefault()}>
                {canEdit && (
                  <DropdownMenuItem
                    className={previewMenuItem}
                    onClick={() => { setEditText(getCommentDisplayText(comment.body)); setEditing(true); }}
                  >
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className={cn(previewMenuItem, previewMenuItemDanger)}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editing ? (
          <div className="space-y-2 pb-2.5">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-brand/30"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={(!editText.trim() && parseCommentAttachments(comment.body).attachments.length === 0) || saving}
                className="rounded-md bg-brand px-2.5 py-1 text-[12px] font-medium text-brand-foreground hover:brightness-110 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditText(getCommentDisplayText(comment.body)); }}
                className="rounded-md border border-border px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={cn("text-[13px] leading-relaxed text-foreground/85", isModal ? "pb-1" : "pb-2.5")}>
            <CommentBody body={comment.body} members={members} compact={isModal} />
          </div>
        )}
      </div>

      {!editing && !isReply && showReplyMeta && (onToggleReplies || onReply) && (
        <div className={cn(
          "flex items-center gap-3",
          isModal ? "px-0 py-1" : "justify-end border-t border-border/40 px-3 py-1.5",
        )}>
          {replyCount > 0 && onToggleReplies && (
            <button
              type="button"
              onClick={onToggleReplies}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-brand"
            >
              {!repliesExpanded && (
                <span>
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </span>
              )}
              {repliesExpanded && (
                <span>Hide replies</span>
              )}
            </button>
          )}
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
          )}
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the comment
              {replyCount > 0 ? " and its replies" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
