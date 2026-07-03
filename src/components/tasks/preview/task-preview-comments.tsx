import { format, isSameDay } from "date-fns";
import { MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { CommentComposer } from "@/components/tasks/details/comment-composer";
import {
  previewBody,
  previewDropdown,
  previewFieldValue,
  previewMenuItem,
  previewMenuItemDanger,
  previewMeta,
} from "@/components/tasks/preview/task-preview-styles";
import type { TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewCommentsProps = {
  comments: TaskCommentNode[];
  members: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  onSubmit: (body: string, parentId?: string | null) => Promise<void>;
  onUpdate: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

function formatCommentTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return format(date, "h:mm a");
  return format(date, "MMM d, h:mm a");
}

function wasEdited(createdAt: string, updatedAt: string) {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
}

function PreviewCommentItem({
  comment,
  members,
  currentUserId,
  canModerate,
  depth = 0,
  onSubmit,
  onUpdate,
  onDelete,
}: {
  comment: TaskCommentNode;
  members: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  depth?: number;
  onSubmit: (body: string, parentId?: string | null) => Promise<void>;
  onUpdate: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const author = comment.author;
  const isAuthor = currentUserId === comment.author_id;
  const canEdit = isAuthor;
  const canDelete = isAuthor || canModerate;
  const edited = wasEdited(comment.created_at, comment.updated_at);

  async function handleSaveEdit() {
    if (!editText.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, editText.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(comment.id);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={cn(depth > 0 && "ml-5 border-l border-border/50 pl-3")}>
      <div className="flex gap-2">
        <ProfileAvatar
          userId={comment.author_id}
          name={author?.full_name}
          avatarUrl={author?.avatar_url}
          email={author?.email}
          size="xs"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className={previewFieldValue}>
              {author?.full_name || "Member"}
              {isAuthor && <span className={cn("ml-1", previewMeta)}>(you)</span>}
            </span>
            <span className={previewMeta}>
              {formatCommentTime(comment.created_at)}
              {edited && " · edited"}
            </span>
            {(canEdit || canDelete) && !editing && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-auto grid size-6 place-items-center rounded text-muted-foreground hover:bg-surface/80"
                    aria-label="Comment actions"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={previewDropdown} onCloseAutoFocus={(e) => e.preventDefault()}>
                  {canEdit && (
                    <DropdownMenuItem
                      className={previewMenuItem}
                      onClick={() => { setEditText(comment.body); setEditing(true); }}
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
            <div className="space-y-1.5">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full resize-y rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-brand/30"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={!editText.trim() || saving}
                  className="rounded-md bg-brand px-2.5 py-1 text-[12px] font-medium text-brand-foreground hover:brightness-110 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditText(comment.body); }}
                  className="rounded-md border border-border px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-surface"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg rounded-tl-sm border border-border/60 bg-surface/50 px-2.5 py-1.5">
              <div className={previewBody}>
                <CommentBody body={comment.body} members={members} />
              </div>
            </div>
          )}

          {!editing && depth === 0 && (
            <button
              type="button"
              onClick={() => setReplyOpen((o) => !o)}
              className={cn("mt-1 inline-flex items-center gap-1 hover:text-brand", previewMeta)}
            >
              <Reply className="size-3" />
              Reply
              {comment.replies.length > 0 && ` (${comment.replies.length})`}
            </button>
          )}

          {replyOpen && (
            <div className="mt-2">
              <CommentComposer
                members={members}
                compact
                layout="card"
                autoFocus
                placeholder="Write a reply…"
                onCancel={() => setReplyOpen(false)}
                onSubmit={async (body) => {
                  await onSubmit(body, comment.id);
                  setReplyOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <PreviewCommentItem
              key={reply.id}
              comment={reply}
              members={members}
              currentUserId={currentUserId}
              canModerate={canModerate}
              depth={depth + 1}
              onSubmit={onSubmit}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the comment
              {comment.replies.length > 0 ? " and its replies" : ""}.
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
    </div>
  );
}

export function TaskPreviewComments({
  comments,
  members,
  currentUserId,
  canModerate,
  onSubmit,
  onUpdate,
  onDelete,
}: TaskPreviewCommentsProps) {
  return (
    <div className="space-y-3">
      <CommentComposer
        members={members}
        compact
        layout="card"
        placeholder="Write a comment…"
        onSubmit={(body) => onSubmit(body)}
      />

      {comments.length === 0 ? (
        <p className={cn("text-center", previewMeta)}>No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <PreviewCommentItem
              key={comment.id}
              comment={comment}
              members={members}
              currentUserId={currentUserId}
              canModerate={canModerate}
              onSubmit={onSubmit}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
