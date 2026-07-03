import { format, isSameDay } from "date-fns";
import { ChevronDown, MessageSquare, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { AnimatedCollapse, collapseChevronClass } from "@/components/ui/animated-collapse";
import { CommentBody } from "@/components/tasks/details/comment-body";
import { CommentComposer } from "@/components/tasks/details/comment-composer";
import { countComments, type TaskCommentNode } from "@/lib/tasks/comments";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskDetailsCommentsProps = {
  comments: TaskCommentNode[];
  members: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  onSubmit: (body: string, parentId?: string | null) => Promise<void>;
  onUpdate: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  bare?: boolean;
  defaultOpen?: boolean;
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

type CommentItemProps = {
  comment: TaskCommentNode;
  members: TaskOrgMember[];
  currentUserId?: string;
  canModerate?: boolean;
  depth?: number;
  onSubmit: (body: string, parentId?: string | null) => Promise<void>;
  onUpdate: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

function CommentItem({
  comment,
  members,
  currentUserId,
  canModerate,
  depth = 0,
  onSubmit,
  onUpdate,
  onDelete,
}: CommentItemProps) {
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
    <div className={cn(depth > 0 && "ml-8 border-l-2 border-border pl-4")}>
      <div className="flex gap-3">
        <ProfileAvatar
          userId={comment.author_id}
          name={author?.full_name}
          avatarUrl={author?.avatar_url}
          email={author?.email}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-foreground">
              {author?.full_name || "Member"}
              {isAuthor && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCommentTime(comment.created_at)}
              {edited && " · edited"}
            </span>

            {(canEdit || canDelete) && !editing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-auto grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                    aria-label="Comment actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => {
                      setEditText(comment.body);
                      setEditing(true);
                    }}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || saving}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground hover:brightness-110 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditText(comment.body);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl rounded-tl-none border border-border bg-surface px-4 py-3">
              <CommentBody body={comment.body} members={members} />
            </div>
          )}

          {!editing && depth === 0 && (
            <button
              type="button"
              onClick={() => setReplyOpen((open) => !open)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-brand"
            >
              <Reply className="size-3.5" />
              Reply
              {comment.replies.length > 0 && ` (${comment.replies.length})`}
            </button>
          )}

          {replyOpen && (
            <div className="mt-3">
              <CommentComposer
                members={members}
                compact
                autoFocus
                submitLabel="Reply"
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
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
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
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
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

export function TaskDetailsComments({
  comments,
  members,
  currentUserId,
  canModerate,
  onSubmit,
  onUpdate,
  onDelete,
  bare = false,
  defaultOpen = false,
}: TaskDetailsCommentsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const totalCount = useMemo(() => countComments(comments), [comments]);

  const body = (
    <>
      <CommentComposer
        members={members}
        onSubmit={(body) => onSubmit(body)}
        className="mb-5"
      />

      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
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
    </>
  );

  if (bare) return body;

  const label = totalCount > 0 ? `Comments (${totalCount})` : "Comments";
  const toggleHint = open
    ? "Hide comments"
    : totalCount > 0
      ? `View ${totalCount} comment${totalCount === 1 ? "" : "s"}`
      : "Add a comment";

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="size-3.5 shrink-0" />
            {label}
          </h2>
          {!open && (
            <p className="mt-1 text-xs text-muted-foreground">{toggleHint}</p>
          )}
        </div>
        <ChevronDown
          className={collapseChevronClass(open, "size-4 shrink-0 text-muted-foreground")}
        />
      </button>

      <AnimatedCollapse open={open} contentClassName="min-h-0">
        <div className="pt-4">{body}</div>
      </AnimatedCollapse>
    </section>
  );
}
