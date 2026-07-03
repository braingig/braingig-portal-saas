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
import { TaskPreviewHint, timerHintLabel } from "@/components/tasks/preview/task-preview-hint";
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
  canStartTimer: boolean;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onDueDateChange: (date: string | null) => void;
  onEstimatedHoursChange: (hours: number | null) => void;
  onAssigneesChange: (ids: string[]) => void;
  onToggleTimer: () => void;
};

function dueDisplay(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isPast(d)) return format(d, "MMM d");
  return format(d, "MMM d");
}

export function TaskPreviewMetaGrid({
  task,
  assignees,
  members,
  trackedSeconds,
  isTracking,
  canStartTimer,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onEstimatedHoursChange,
  onAssigneesChange,
  onToggleTimer,
}: TaskPreviewMetaGridProps) {
  const statusMeta = getTaskStatusMeta(task.status);
  const statusPill = TASK_STATUS_PILL[task.status] ?? TASK_STATUS_PILL.todo;

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
      <MetaCell icon={CheckCircle2} label="Status">
        <StatusField status={task.status} label={statusMeta.label} pillClass={statusPill} onChange={onStatusChange} />
      </MetaCell>

      <MetaCell icon={User} label="Assignees">
        <AssigneeField assignees={assignees} members={members} onChange={onAssigneesChange} />
      </MetaCell>

      <MetaCell icon={Calendar} label="Dates">
        <DueDateField dueDate={task.due_date} onChange={onDueDateChange} />
      </MetaCell>

      <MetaCell icon={Flag} label="Priority">
        <PriorityField priority={task.priority} onChange={onPriorityChange} />
      </MetaCell>

      <MetaCell icon={Hourglass} label="Time Estimate">
        <EstimateField hours={task.estimated_hours} onChange={onEstimatedHoursChange} />
      </MetaCell>

      <MetaCell icon={Clock} label="Track Time">
        <TaskPreviewHint label={timerHintLabel(isTracking, canStartTimer)}>
          <button
            type="button"
            onClick={onToggleTimer}
            disabled={!isTracking && !canStartTimer}
            className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTracking ? (
              <Square className="size-3.5 text-danger" />
            ) : (
              <Play className="size-3.5 text-muted-foreground" />
            )}
            <span className="tabular-nums">
              {trackedSeconds > 0 ? formatDurationHuman(trackedSeconds) : "Empty"}
            </span>
          </button>
        </TaskPreviewHint>
      </MetaCell>
    </div>
  );
}

function MetaCell({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-border/30 py-3 last:border-b-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
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
        <button type="button" className="inline-flex items-center gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", pillClass)}>
            {label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1">
        {TASK_STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { onChange(s.key); setOpen(false); }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-surface",
              s.key === status && "bg-surface font-medium",
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

  if (assignees.length === 0) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button"><EmptyValue /></button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-52 p-2">
          <AssigneePicker assignees={assignees} available={available} ids={ids} onChange={onChange} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex flex-wrap items-center gap-2">
          {assignees.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <ProfileAvatar userId={a.id} name={a.full_name} avatarUrl={a.avatar_url} size="xs" />
              {a.full_name}
            </span>
          ))}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-2">
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
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-surface"
        >
          <ProfileAvatar userId={m.id} name={m.full_name} avatarUrl={m.avatar_url} size="xs" />
          {m.full_name}
        </button>
      ))}
    </div>
  );
}

function DueDateField({
  dueDate,
  onChange,
}: {
  dueDate: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const due = dueDisplay(dueDate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="text-sm text-foreground">
          <span className="text-muted-foreground/80">Start</span>
          <span className="mx-1.5 text-muted-foreground/50">→</span>
          {due ? <span>{due}</span> : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-3">
        <p className="mb-2 text-xs text-muted-foreground">Due date</p>
        <Input type="date" value={dueDate?.slice(0, 10) ?? ""} onChange={(e) => onChange(e.target.value || null)} className="h-8 text-sm" />
        {dueDate && (
          <button type="button" onClick={() => onChange(null)} className="mt-2 text-xs text-muted-foreground hover:text-danger">Clear</button>
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
        <button type="button" className="text-sm capitalize text-foreground">
          {hasValue ? priority : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-40 p-1">
        {TASK_PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => { onChange(p.value); setOpen(false); }}
            className={cn("w-full rounded-md px-2.5 py-1.5 text-left text-sm capitalize hover:bg-surface", p.value === priority && "bg-surface font-medium")}
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
        <button type="button" className="text-sm text-foreground">
          {hours != null ? `${hours}h` : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-3">
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
          className="h-8 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
