import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Hourglass,
  Play,
  Square,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  previewFieldLabel,
  previewFieldRow,
  previewFieldValueBtn,
  previewPopoverContent,
} from "@/components/tasks/preview/task-preview-styles";
import { TaskTimerHint } from "@/components/tasks/task-timer-hint";
import { TASK_PRIORITIES } from "@/lib/tasks/constants";
import { getTaskStatusMeta, TASK_STATUSES, TASK_STATUS_PILL } from "@/lib/tasks/status";
import { formatDurationHuman } from "@/lib/task-timer";
import type { TaskDetailProfile, TaskDetailRecord, TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewMetaGridProps = {
  task: TaskDetailRecord;
  assignees: TaskDetailProfile[];
  members: TaskOrgMember[];
  trackedSeconds: number;
  isTracking: boolean;
  isAssignee: boolean;
  timerStartBlocked: boolean;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  onEstimatedHoursChange: (hours: number | null) => void;
  onAssigneesChange: (ids: string[]) => void;
  onToggleTimer: () => void;
};

function dateDisplay(date: string | null) {
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : `${date}T12:00:00`);
  if (isToday(d)) return "Today";
  if (isPast(d)) return format(d, "MMM d");
  return format(d, "MMM d");
}

function toDateInputValue(date: string | null | undefined) {
  if (!date) return "";
  return date.slice(0, 10);
}

export function TaskPreviewMetaGrid({
  task,
  assignees,
  members,
  trackedSeconds,
  isTracking,
  isAssignee,
  timerStartBlocked,
  onStatusChange,
  onPriorityChange,
  onStartDateChange,
  onEndDateChange,
  onEstimatedHoursChange,
  onAssigneesChange,
  onToggleTimer,
}: TaskPreviewMetaGridProps) {
  const statusMeta = getTaskStatusMeta(task.status);
  const statusPill = TASK_STATUS_PILL[task.status] ?? TASK_STATUS_PILL.todo;

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2 md:gap-x-6 xl:grid-cols-3 xl:gap-x-8">
      <MetaRow icon={CheckCircle2} label="Status">
        <StatusField status={task.status} label={statusMeta.label} pillClass={statusPill} onChange={onStatusChange} />
      </MetaRow>

      <MetaRow icon={User} label="Assignees">
        <AssigneeField assignees={assignees} members={members} onChange={onAssigneesChange} />
      </MetaRow>

      <MetaRow icon={Calendar} label="Dates">
        <DatesField
          startDate={task.start_date ?? null}
          endDate={task.due_date}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      </MetaRow>

      <MetaRow icon={Flag} label="Priority">
        <PriorityField priority={task.priority} onChange={onPriorityChange} />
      </MetaRow>

      <MetaRow icon={Hourglass} label="Time Estimate">
        <EstimateField hours={task.estimated_hours} onChange={onEstimatedHoursChange} />
      </MetaRow>

      <MetaRow icon={Clock} label="Track Time">
        <TaskTimerHint isTracking={isTracking} isAssignee={isAssignee}>
          <button
            type="button"
            onClick={onToggleTimer}
            disabled={!isTracking && timerStartBlocked}
            className={cn(
              previewFieldValueBtn,
              "inline-flex items-center gap-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isTracking ? (
              <Square className="size-3.5 shrink-0 text-danger" />
            ) : (
              <Play className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate tabular-nums">
              {trackedSeconds > 0 ? formatDurationHuman(trackedSeconds) : "Empty"}
            </span>
          </button>
        </TaskTimerHint>
      </MetaRow>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(previewFieldRow, "group")}>
      <Icon className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
      <span className={previewFieldLabel}>{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function EmptyValue({ children }: { children?: React.ReactNode }) {
  return (
    <span className="text-sm text-muted-foreground/80">
      {children ?? "Empty"}
    </span>
  );
}

function StatusField({
  status,
  label,
  pillClass,
  onChange,
}: {
  status: string;
  label: string;
  pillClass: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "inline-flex min-w-0 items-center gap-1.5")}>
          <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", pillClass)}>
            {label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-44 p-1")}>
        {TASK_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { onChange(s.key); setOpen(false); }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/55 dark:hover:bg-surface/70",
              s.key === status && "bg-muted/40 font-medium dark:bg-surface/60",
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

function AssigneeField({
  assignees,
  members,
  onChange,
}: {
  assignees: TaskDetailProfile[];
  members: TaskOrgMember[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ids = assignees.map((a) => a.id);
  const available = members.filter((m) => !ids.includes(m.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(previewFieldValueBtn, "flex min-w-0 flex-wrap items-center gap-2")}
        >
          {assignees.length === 0 ? (
            <EmptyValue />
          ) : (
            assignees.map((a) => (
              <span key={a.id} className="inline-flex max-w-full items-center gap-1.5 text-sm text-foreground">
                <ProfileAvatar userId={a.id} name={a.full_name} avatarUrl={a.avatar_url} size="xs" />
                <span className="truncate">{a.full_name}</span>
              </span>
            ))
          )}
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
          <button type="button" onClick={() => onChange(ids.filter((id) => id !== a.id))} className="text-xs text-muted-foreground hover:text-danger">×</button>
        </div>
      ))}
      {available.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange([...ids, m.id])}
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted/55 dark:hover:bg-surface/70"
        >
          <ProfileAvatar userId={m.id} name={m.full_name} avatarUrl={m.avatar_url} size="xs" />
          {m.full_name}
        </button>
      ))}
    </div>
  );
}

function DatesField({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (v: string | null) => void;
  onEndDateChange: (v: string | null) => void;
}) {
  const start = dateDisplay(startDate);
  const end = dateDisplay(endDate);

  return (
    <div className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm">
      <SingleDatePopover
        title="Start date"
        value={startDate}
        display={start}
        placeholder="Start"
        onChange={onStartDateChange}
        onClear={startDate ? () => onStartDateChange(null) : undefined}
      />
      <span className="shrink-0 text-muted-foreground/50">→</span>
      <SingleDatePopover
        title="End date"
        value={endDate}
        display={end}
        placeholder="End"
        min={toDateInputValue(startDate) || undefined}
        onChange={onEndDateChange}
        onClear={endDate ? () => onEndDateChange(null) : undefined}
      />
    </div>
  );
}

function SingleDatePopover({
  title,
  value,
  display,
  placeholder,
  min,
  onChange,
  onClear,
}: {
  title: string;
  value: string | null;
  display: string | null;
  placeholder: string;
  min?: string;
  onChange: (v: string | null) => void;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {display ? <span>{display}</span> : <EmptyValue>{placeholder}</EmptyValue>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn(previewPopoverContent, "w-52")}>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <Input
          type="date"
          value={toDateInputValue(value)}
          min={min}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-9 border-border/60 bg-surface/40 text-sm"
        />
        {onClear && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="mt-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PriorityField({ priority, onChange }: { priority: string; onChange: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(priority);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm capitalize text-foreground")}>
          {hasValue ? priority : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-40 p-1")}>
        {TASK_PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => { onChange(p.value); setOpen(false); }}
            className={cn(
              "w-full rounded-md px-2.5 py-1.5 text-left text-sm capitalize hover:bg-muted/55 dark:hover:bg-surface/70",
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

function EstimateField({
  hours,
  onChange,
}: {
  hours: number | null;
  onChange: (h: number | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {hours != null ? `${hours}h` : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-44")}>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Time estimate
        </p>
        <Input
          type="number"
          min="0"
          step="0.25"
          placeholder="Hours"
          value={hours ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
          className="h-9 border-border/60 bg-surface/40 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
