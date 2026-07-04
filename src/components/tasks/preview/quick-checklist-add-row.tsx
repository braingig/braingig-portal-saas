import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { previewPopoverContent } from "@/components/tasks/preview/task-preview-styles";
import { tasksIconSm } from "@/components/tasks/tasks-page-styles";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type QuickChecklistAddRowProps = {
  members: TaskOrgMember[];
  onAdd: (title: string, assigneeId: string | null) => Promise<void>;
  onCancel: () => void;
  autoFocus?: boolean;
};

export function QuickChecklistAddRow({
  members,
  onAdd,
  onCancel,
  autoFocus = true,
}: QuickChecklistAddRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(trimmed, assigneeId);
      setTitle("");
      setAssigneeId(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-md border border-border/40 bg-surface/30 px-2 py-2"
    >
      <span
        className="size-4 shrink-0 rounded border border-dashed border-muted-foreground/40"
        aria-hidden
      />

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Checklist item"
        disabled={submitting}
        className="min-w-[8rem] flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50"
      />

      <SingleAssigneeControl
        members={members}
        assigneeId={assigneeId}
        onChange={setAssigneeId}
      />

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[12px] font-medium text-brand-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
          <CornerDownLeft className="size-3" strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}

export function SingleAssigneeControl({
  members,
  assigneeId,
  onChange,
  compact = false,
}: {
  members: TaskOrgMember[];
  assigneeId: string | null;
  onChange: (id: string | null) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = members.find((m) => m.id === assigneeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-[9rem] items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground",
            selected && "border border-border/40 bg-surface/60 text-foreground",
          )}
          aria-label="Assignee"
        >
          {selected ? (
            <>
              <ProfileAvatar
                userId={selected.id}
                name={selected.full_name}
                avatarUrl={selected.avatar_url}
                size="xs"
              />
              {!compact && (
                <span className="truncate text-[12px]">{selected.full_name}</span>
              )}
            </>
          ) : (
            <User className={tasksIconSm} strokeWidth={1.75} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn(previewPopoverContent, "w-52 p-2")}>
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {selected && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/55 dark:hover:bg-surface/70"
            >
              Unassign
            </button>
          )}
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-muted/55 dark:hover:bg-surface/70",
                m.id === assigneeId && "bg-muted/40 font-medium dark:bg-surface/60",
              )}
            >
              <ProfileAvatar userId={m.id} name={m.full_name} avatarUrl={m.avatar_url} size="xs" />
              {m.full_name}
            </button>
          ))}
          {members.length === 0 && (
            <p className="px-1 py-1 text-xs text-muted-foreground">No team members</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
