import { useEffect, useRef, useState } from "react";
import { Calendar, CornerDownLeft, Flag, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { previewInteractiveHover, previewPopoverContent } from "@/components/tasks/preview/task-preview-styles";
import {
  tasksIconSm,
  tasksListDivider,
  tasksRowHover,
} from "@/components/tasks/tasks-page-styles";
import { TASK_FORM_DEFAULTS, TASK_PRIORITIES, type TaskFormValues, type TaskPriority } from "@/lib/tasks/constants";
import { createTask } from "@/lib/tasks/create-task";
import { TASK_PRIORITY_STYLES } from "@/lib/tasks/status";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type QuickTaskAddRowProps = {
  orgId: string;
  userId: string;
  members: TaskOrgMember[];
  projectId?: string;
  milestoneId?: string;
  parentTaskId?: string;
  position?: number;
  isSubtask?: boolean;
  variant?: "list" | "preview";
  nestedInFolder?: boolean;
  autoFocus?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

export function QuickTaskAddRow({
  orgId,
  userId,
  members,
  projectId,
  milestoneId,
  parentTaskId,
  position = 0,
  isSubtask = false,
  variant = "list",
  nestedInFolder = false,
  autoFocus = true,
  onSuccess,
  onCancel,
}: QuickTaskAddRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [submitting, setSubmitting] = useState(false);

  const isPreview = variant === "preview";
  const textSize = isPreview ? "text-[13px]" : "text-xs";
  const placeholder = isSubtask ? "Subtask name" : "Task name";

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  useEffect(() => {
    if (!parentTaskId) return;

    Promise.all([
      supabase.from("tasks").select("assignee_id").eq("id", parentTaskId).single(),
      supabase.from("task_assignees").select("user_id").eq("task_id", parentTaskId),
    ]).then(([taskRes, assigneeRes]) => {
      const ids = new Set<string>();
      for (const row of assigneeRes.data ?? []) ids.add(row.user_id);
      if (taskRes.data?.assignee_id) ids.add(taskRes.data.assignee_id);
      if (ids.size > 0) setAssigneeIds([...ids]);
    });
  }, [parentTaskId]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Task name is required");
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const authorName =
        members.find((m) => m.id === userId)?.full_name ?? "Someone";

      const values: TaskFormValues = {
        ...TASK_FORM_DEFAULTS,
        title: trimmed,
        priority,
        projectId: projectId ?? "",
        milestoneId: milestoneId ?? "",
        assigneeIds,
        dueDate,
      };

      await createTask({
        orgId,
        userId,
        authorName,
        values,
        files: [],
        mentionMembers: members,
        parentId: parentTaskId ?? null,
        position,
      });

      toast.success(isSubtask ? "Subtask created" : "Task created");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create task";
      toast.error(msg);
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

  const rowPadding = isSubtask
    ? "pl-14 pr-3 sm:pl-16"
    : nestedInFolder
      ? "pr-5"
      : "px-5";

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex min-h-[40px] flex-wrap items-center gap-x-2 gap-y-2 border-b py-2",
        tasksListDivider,
        !isPreview && tasksRowHover,
        !isPreview && rowPadding,
        isPreview && "rounded-md border border-border/40 bg-surface/30 px-2 py-2",
      )}
    >
      <span
        className={cn(
          "size-3.5 shrink-0 rounded-full border border-dashed border-muted-foreground/40",
          isSubtask && "ml-0",
        )}
        aria-hidden
      />

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={submitting}
        className={cn(
          "min-w-[8rem] flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50",
          textSize,
        )}
      />

      <div className="flex shrink-0 items-center gap-0.5">
        <AssigneeControl
          members={members}
          assigneeIds={assigneeIds}
          onChange={setAssigneeIds}
          isPreview={isPreview}
        />
        <DueDateControl dueDate={dueDate} onChange={setDueDate} isPreview={isPreview} />
        <PriorityControl priority={priority} onChange={setPriority} isPreview={isPreview} />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={cn(
            "rounded-md px-2 py-1 text-muted-foreground disabled:opacity-50",
            previewInteractiveHover,
            isPreview ? "text-[12px]" : "text-[11px]",
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 font-medium text-brand-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
            isPreview ? "text-[12px]" : "text-[11px]",
          )}
        >
          Save
          <CornerDownLeft className={cn(isPreview ? "size-3" : "size-2.5")} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}

function AssigneeControl({
  members,
  assigneeIds,
  onChange,
  isPreview,
}: {
  members: TaskOrgMember[];
  assigneeIds: string[];
  onChange: (ids: string[]) => void;
  isPreview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = members.filter((m) => assigneeIds.includes(m.id));
  const available = members.filter((m) => !assigneeIds.includes(m.id));
  const popoverClass = isPreview ? previewPopoverContent : "w-52 p-2";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-[9rem] items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground",
            previewInteractiveHover,
            selected.length > 0 && "border border-border/40 bg-surface/60 text-foreground",
          )}
          aria-label="Assignees"
        >
          {selected.length === 0 ? (
            <User className={tasksIconSm} strokeWidth={1.75} />
          ) : (
            <>
              <ProfileAvatar
                userId={selected[0].id}
                name={selected[0].full_name}
                avatarUrl={selected[0].avatar_url}
                size="xs"
              />
              <span className={cn("truncate", isPreview ? "text-[12px]" : "text-[11px]")}>
                {selected.length === 1 ? selected[0].full_name : `${selected.length} assigned`}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={popoverClass}>
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {selected.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
              <div className="flex min-w-0 items-center gap-2">
                <ProfileAvatar userId={m.id} name={m.full_name} avatarUrl={m.avatar_url} size="xs" />
                <span className="truncate text-xs">{m.full_name}</span>
              </div>
              <button
                type="button"
                onClick={() => onChange(assigneeIds.filter((id) => id !== m.id))}
                className="text-xs text-muted-foreground hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
          {available.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange([...assigneeIds, m.id])}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-muted/55 dark:hover:bg-surface/70"
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

function DueDateControl({
  dueDate,
  onChange,
  isPreview,
}: {
  dueDate: string;
  onChange: (v: string) => void;
  isPreview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const popoverClass = isPreview ? cn(previewPopoverContent, "w-52") : "w-52";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "grid size-7 place-items-center rounded-md text-muted-foreground",
            previewInteractiveHover,
            dueDate && "text-brand",
          )}
          aria-label="Due date"
        >
          <Calendar className={tasksIconSm} strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={popoverClass}>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Due date
        </p>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 border-border/60 bg-surface/40 text-xs"
        />
        {dueDate && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mt-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-danger"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PriorityControl({
  priority,
  onChange,
  isPreview,
}: {
  priority: TaskPriority;
  onChange: (p: TaskPriority) => void;
  isPreview: boolean;
}) {
  const [open, setOpen] = useState(false);
  const popoverClass = isPreview ? cn(previewPopoverContent, "w-36 p-1") : "w-36 p-1";
  const flagClass = TASK_PRIORITY_STYLES[priority]?.split(" ").find((c) => c.startsWith("text-")) ?? "text-muted-foreground";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("grid size-7 place-items-center rounded-md text-muted-foreground", previewInteractiveHover)}
          aria-label="Priority"
        >
          <Flag className={cn(tasksIconSm, flagClass)} strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={popoverClass}>
        {TASK_PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              onChange(p.value);
              setOpen(false);
            }}
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-xs capitalize hover:bg-muted/55 dark:hover:bg-surface/70",
              p.value === priority && "bg-muted/40 font-medium dark:bg-surface/60",
            )}
          >
            {p.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
