import { useState } from "react";
import { format, isPast, isToday, startOfDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  CircleDot,
  Clock,
  Play,
  Square,
  Tag,
  User,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  previewFieldValueBtn,
  previewMetaListLabel,
  previewMetaListLabelCompact,
  previewMetaListRow,
  previewPopoverContent,
  previewSegmentedButton,
  previewSegmentedControl,
} from "@/components/tasks/preview/task-preview-styles";
import { TaskTimerHint } from "@/components/tasks/task-timer-hint";
import { TASK_PRIORITIES } from "@/lib/tasks/constants";
import { getTaskStatusMeta, TASK_STATUSES, TASK_STATUS_PILL } from "@/lib/tasks/status";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskDetailProfile, TaskDetailRecord, TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_AVATARS = 3;

type TaskPreviewMetaGridProps = {
  task: TaskDetailRecord;
  assignees: TaskDetailProfile[];
  members: TaskOrgMember[];
  compact?: boolean;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  onAssigneesChange: (ids: string[]) => void;
  trackedSeconds?: number;
  isTracking?: boolean;
  isAssignee?: boolean;
  timerStartBlocked?: boolean;
  onToggleTimer?: () => void;
};

function formatDisplayDate(date: string | null) {
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : `${date}T12:00:00`);
  if (isToday(d)) return "Today";
  return format(d, "d MMM yyyy");
}

function parseTaskDate(date: string | null | undefined) {
  if (!date) return undefined;
  return new Date(date.includes("T") ? date : `${date}T12:00:00`);
}

const PRIORITY_TAG_STYLES: Record<string, string> = {
  high: "border-pink-200/80 bg-pink-50 text-pink-700 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-300",
  medium: "border-brand/25 bg-brand/10 text-brand",
  low: "border-violet-200/80 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  urgent: "border-danger/30 bg-danger/10 text-danger",
};

export function TaskPreviewMetaGrid({
  task,
  assignees,
  members,
  compact = false,
  onStatusChange,
  onPriorityChange,
  onStartDateChange,
  onEndDateChange,
  onAssigneesChange,
  trackedSeconds = 0,
  isTracking = false,
  isAssignee = false,
  timerStartBlocked = false,
  onToggleTimer,
}: TaskPreviewMetaGridProps) {
  const statusMeta = getTaskStatusMeta(task.status);
  const statusPill = TASK_STATUS_PILL[task.status] ?? TASK_STATUS_PILL.todo;
  const startLabel = formatDisplayDate(task.start_date ?? null);
  const dueLabel = formatDisplayDate(task.due_date);
  const priorityStyle = PRIORITY_TAG_STYLES[task.priority] ?? PRIORITY_TAG_STYLES.medium;
  const overflowCount = Math.max(0, assignees.length - MAX_VISIBLE_AVATARS);
  const visibleAssignees = assignees.slice(0, MAX_VISIBLE_AVATARS);

  return (
    <div className={cn("space-y-0.5", compact && "space-y-0")}>
      <MetaRow icon={CircleDot} label="Status" compact={compact}>
        <StatusField
          status={task.status}
          label={statusMeta.label}
          colorClass={statusMeta.color}
          pillClass={statusPill}
          onChange={onStatusChange}
        />
      </MetaRow>

      <MetaRow icon={CalendarIcon} label="Dates" compact={compact}>
        <DueDateField
          dueDate={task.due_date}
          startDate={task.start_date ?? null}
          startLabel={startLabel}
          dueLabel={dueLabel}
          onDueDateChange={onEndDateChange}
          onStartDateChange={onStartDateChange}
        />
      </MetaRow>

      <MetaRow icon={User} label="Assignee" compact={compact}>
        <AssigneeField
          assignees={assignees}
          members={members}
          visibleAssignees={visibleAssignees}
          overflowCount={overflowCount}
          onChange={onAssigneesChange}
        />
      </MetaRow>

      <MetaRow icon={Tag} label="Priority" compact={compact}>
        <PriorityField
          priority={task.priority}
          priorityStyle={priorityStyle}
          onChange={onPriorityChange}
        />
      </MetaRow>

      {onToggleTimer && (
        <MetaRow icon={Clock} label="Track time" compact={compact}>
          <TrackTimeField
            trackedSeconds={trackedSeconds}
            isTracking={isTracking}
            isAssignee={isAssignee}
            timerStartBlocked={timerStartBlocked}
            onToggleTimer={onToggleTimer}
          />
        </MetaRow>
      )}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  compact = false,
  children,
}: {
  icon: typeof User;
  label: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const labelClass = compact ? previewMetaListLabelCompact : previewMetaListLabel;

  return (
    <div className={cn(previewMetaListRow, compact && "min-h-[2.25rem] py-1")}>
      <div className={labelClass}>
        <Icon className="size-3.5 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
        <span>{label}</span>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  );
}

function StatusField({
  status,
  label,
  colorClass,
  pillClass,
  onChange,
}: {
  status: string;
  label: string;
  colorClass: string;
  pillClass: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors hover:opacity-90",
            pillClass,
          )}
        >
          <span className={cn("size-2 rounded-full", colorClass)} />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-44 p-1")}>
        {TASK_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { onChange(s.key); setOpen(false); }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/55",
              s.key === status && "bg-muted/40 font-medium",
            )}
          >
            <span className={cn("size-1.5 rounded-full", s.color)} />
            {s.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function DueDateField({
  dueDate,
  startDate,
  startLabel,
  dueLabel,
  onDueDateChange,
  onStartDateChange,
}: {
  dueDate: string | null;
  startDate: string | null;
  startLabel: string | null;
  dueLabel: string | null;
  onDueDateChange: (v: string | null) => void;
  onStartDateChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<"start" | "due">("start");

  const startParsed = parseTaskDate(startDate);
  const dueParsed = parseTaskDate(dueDate);
  const selectedDate = activeField === "start" ? startParsed : dueParsed;
  const defaultMonth = selectedDate ?? startParsed ?? dueParsed ?? new Date();

  const isOverdue = dueDate
    ? isPast(new Date(dueDate.includes("T") ? dueDate : `${dueDate}T12:00:00`))
      && !isToday(new Date(dueDate.includes("T") ? dueDate : `${dueDate}T12:00:00`))
    : false;

  const displayText = (() => {
    if (startLabel && dueLabel) return `${startLabel} → ${dueLabel}`;
    if (startLabel) return `${startLabel} → End`;
    if (dueLabel) return dueLabel;
    return null;
  })();

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const value = format(date, "yyyy-MM-dd");
    if (activeField === "start") {
      onStartDateChange(value);
      if (dueParsed && startOfDay(dueParsed) < startOfDay(date)) {
        onDueDateChange(null);
      }
    } else {
      onDueDateChange(value);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setActiveField(startDate || !dueDate ? "start" : "due");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-left text-[12px] font-medium transition-colors hover:text-brand",
            displayText ? (isOverdue && dueLabel ? "text-danger" : "text-foreground") : "text-muted-foreground/70",
          )}
        >
          {displayText ?? "Set dates"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(previewPopoverContent, "w-auto p-0")}
      >
        <div className="space-y-3 border-b border-border/50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Dates
          </p>
          <div className={previewSegmentedControl}>
            <button
              type="button"
              data-active={activeField === "start"}
              onClick={() => setActiveField("start")}
              className={cn(previewSegmentedButton, "flex-1")}
            >
              Start
            </button>
            <button
              type="button"
              data-active={activeField === "due"}
              onClick={() => setActiveField("due")}
              className={cn(previewSegmentedButton, "flex-1")}
            >
              Due
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-surface/30 px-2.5 py-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {activeField === "start" ? "Start date" : "Due date"}
              </p>
              <p className="truncate text-sm font-medium text-foreground">
                {activeField === "start"
                  ? (startLabel ?? "Not set")
                  : (dueLabel ?? "Not set")}
              </p>
            </div>
            {(activeField === "start" ? startDate : dueDate) && (
              <button
                type="button"
                onClick={() => {
                  if (activeField === "start") onStartDateChange(null);
                  else onDueDateChange(null);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-danger"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={defaultMonth}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (activeField === "due" && startParsed) {
              return startOfDay(date) < startOfDay(startParsed);
            }
            return false;
          }}
          className="p-2"
        />
        {(dueDate || startDate) && (
          <div className="border-t border-border/50 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onDueDateChange(null);
                onStartDateChange(null);
                setOpen(false);
              }}
              className="w-full rounded-md py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-danger"
            >
              Clear all dates
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AssigneeField({
  assignees,
  members,
  visibleAssignees,
  overflowCount,
  onChange,
}: {
  assignees: TaskDetailProfile[];
  members: TaskOrgMember[];
  visibleAssignees: TaskDetailProfile[];
  overflowCount: number;
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ids = assignees.map((a) => a.id);
  const available = members.filter((m) => !ids.includes(m.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex flex-wrap items-center gap-2">
          {assignees.length > 0 && (
            <span className="flex items-center -space-x-2">
              {visibleAssignees.map((a) => (
                <ProfileAvatar
                  key={a.id}
                  userId={a.id}
                  name={a.full_name}
                  avatarUrl={a.avatar_url}
                  size="sm"
                  className="ring-2 ring-card"
                />
              ))}
              {overflowCount > 0 && (
                <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-[11px] font-medium text-muted-foreground ring-2 ring-card">
                  +{overflowCount}
                </span>
              )}
            </span>
          )}
          <span className="rounded-lg border border-dashed border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-surface/50 hover:text-foreground">
            Add +
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-52 p-2")}>
        <AssigneePicker assignees={assignees} available={available} ids={ids} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

function AssigneePicker({
  assignees,
  available,
  ids,
  onChange,
}: {
  assignees: TaskDetailProfile[];
  available: TaskOrgMember[];
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="max-h-48 space-y-1 overflow-y-auto">
      {assignees.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
          <div className="flex items-center gap-2">
            <ProfileAvatar userId={a.id} name={a.full_name} avatarUrl={a.avatar_url} size="xs" />
            <span className="text-sm">{a.full_name}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(ids.filter((id) => id !== a.id))}
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
          onClick={() => onChange([...ids, m.id])}
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted/55"
        >
          <ProfileAvatar userId={m.id} name={m.full_name} avatarUrl={m.avatar_url} size="xs" />
          {m.full_name}
        </button>
      ))}
    </div>
  );
}

function PriorityField({
  priority,
  priorityStyle,
  onChange,
}: {
  priority: string;
  priorityStyle: string;
  onChange: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = TASK_PRIORITIES.find((p) => p.value === priority)?.label ?? priority;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium capitalize",
            priorityStyle,
          )}>
            <span className="size-1.5 rounded-full bg-current opacity-70" />
            {label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-40 p-1")}>
        {TASK_PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => { onChange(p.value); setOpen(false); }}
            className={cn(
              "w-full rounded-md px-2.5 py-1.5 text-left text-sm capitalize hover:bg-muted/55",
              p.value === priority && "bg-muted/40 font-medium",
            )}
          >
            {p.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function TrackTimeField({
  trackedSeconds,
  isTracking,
  isAssignee,
  timerStartBlocked,
  onToggleTimer,
}: {
  trackedSeconds: number;
  isTracking: boolean;
  isAssignee: boolean;
  timerStartBlocked: boolean;
  onToggleTimer: () => void;
}) {
  return (
    <TaskTimerHint isTracking={isTracking} isAssignee={isAssignee}>
      <button
        type="button"
        onClick={onToggleTimer}
        disabled={!isTracking && timerStartBlocked}
        className={cn(
          previewFieldValueBtn,
          "inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isTracking ? (
          <Square className="size-3 shrink-0 text-danger" />
        ) : (
          <Play className="size-3 shrink-0 text-muted-foreground" />
        )}
        <span className="tabular-nums">
          {trackedSeconds > 0 ? formatDurationHuman(trackedSeconds) : "Start timer"}
        </span>
      </button>
    </TaskTimerHint>
  );
}
