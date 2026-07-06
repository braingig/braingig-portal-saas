import { useState } from "react";
import { format, isPast, isToday, startOfDay } from "date-fns";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Flag,
  Hourglass,
  Play,
  Square,
  User,
  X,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  previewClickupDateBtn,
  previewClickupEmpty,
  previewClickupFieldsContainer,
  previewClickupMetaLabel,
  previewClickupMetaRow,
  previewClickupRowValue,
  previewClickupStatusBadge,
  previewClickupStatusCheck,
  previewClickupStatusGroup,
  previewClickupStatusLabel,
  previewClickupStatusNext,
  previewClickupTrackTime,
  previewClickupTrackTimePlay,
  previewPopoverContent,
  previewScrollHidden,
  previewSegmentedButton,
  previewSegmentedControl,
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
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  onEstimatedHoursChange: (hours: number | null) => void;
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
  return format(d, "MMM d");
}

function parseTaskDate(date: string | null | undefined) {
  if (!date) return undefined;
  return new Date(date.includes("T") ? date : `${date}T12:00:00`);
}

function getNextStatus(current: string) {
  const idx = TASK_STATUSES.findIndex((s) => s.key === current);
  if (idx === -1) return TASK_STATUSES[0].key;
  return TASK_STATUSES[(idx + 1) % TASK_STATUSES.length].key;
}

function isPriorityEmpty(priority: string) {
  return !priority || priority === "medium";
}

export function TaskPreviewMetaGrid({
  task,
  assignees,
  members,
  onStatusChange,
  onPriorityChange,
  onStartDateChange,
  onEndDateChange,
  onEstimatedHoursChange,
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
  const nextStatus = getNextStatus(task.status);
  const nextStatusMeta = getTaskStatusMeta(nextStatus);

  return (
    <div className={previewClickupFieldsContainer}>
      <MetaRow icon={CircleDot} label="Status">
        <StatusField
          status={task.status}
          label={statusMeta.label}
          pillClass={statusPill}
          nextStatus={nextStatus}
          nextStatusLabel={nextStatusMeta.label}
          onChange={onStatusChange}
        />
      </MetaRow>

      <MetaRow icon={User} label="Assignees">
        <AssigneeField
          assignees={assignees}
          members={members}
          onChange={onAssigneesChange}
        />
      </MetaRow>

      <MetaRow icon={CalendarIcon} label="Dates">
        <DueDateField
          dueDate={task.due_date}
          startDate={task.start_date ?? null}
          startLabel={startLabel}
          dueLabel={dueLabel}
          onDueDateChange={onEndDateChange}
          onStartDateChange={onStartDateChange}
        />
      </MetaRow>

      <MetaRow icon={Flag} label="Priority">
        <PriorityField priority={task.priority} onChange={onPriorityChange} />
      </MetaRow>

      <MetaRow icon={Hourglass} label="Time estimate">
        <TimeEstimateField
          estimatedHours={task.estimated_hours}
          onChange={onEstimatedHoursChange}
        />
      </MetaRow>

      {onToggleTimer && (
        <MetaRow icon={Clock} label="Track time">
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
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={previewClickupMetaRow}>
      <div className={previewClickupMetaLabel}>
        <Icon className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.5} />
        <span>{label}</span>
      </div>
      <div className={previewClickupRowValue}>{children}</div>
    </div>
  );
}

function StatusField({
  status,
  label,
  pillClass,
  nextStatus,
  nextStatusLabel,
  onChange,
}: {
  status: string;
  label: string;
  pillClass: string;
  nextStatus: string;
  nextStatusLabel: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={previewClickupStatusGroup}>
      <div className={cn(previewClickupStatusBadge, pillClass)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={previewClickupStatusLabel}>
              {label.toLowerCase()}
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
        <button
          type="button"
          className={previewClickupStatusNext}
          aria-label={`Next status [${nextStatusLabel}]`}
          onClick={() => onChange(nextStatus)}
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      <button
        type="button"
        className={previewClickupStatusCheck}
        aria-label="Mark as done"
        onClick={() => onChange("done")}
      >
        <Check className="size-4" strokeWidth={2.25} />
      </button>
    </div>
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

  function openField(field: "start" | "due") {
    setActiveField(field);
    setOpen(true);
  }

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => openField("start")}
            className={cn(
              previewClickupDateBtn,
              startLabel ? "font-medium text-foreground" : previewClickupEmpty,
            )}
          >
            <CalendarPlus className="size-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
            {startLabel ?? "Start"}
          </button>
          <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
          <button
            type="button"
            onClick={() => openField("due")}
            className={cn(
              previewClickupDateBtn,
              dueLabel
                ? cn("font-medium", isOverdue ? "text-danger" : "text-foreground")
                : previewClickupEmpty,
            )}
          >
            <CalendarPlus className="size-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
            {dueLabel ?? "Due"}
          </button>
        </div>
      </PopoverAnchor>
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
      <div className="group/assignees inline-flex max-w-full items-center gap-2">
        <PopoverTrigger asChild>
          <button type="button" className="inline-flex min-w-0 items-center gap-2 text-left">
            {assignees.length === 0 ? (
              <span className={previewClickupEmpty}>Empty</span>
            ) : (
              <>
                <span className="flex shrink-0 items-center -space-x-1">
                  {assignees.slice(0, 3).map((a) => (
                    <ProfileAvatar
                      key={a.id}
                      userId={a.id}
                      name={a.full_name}
                      avatarUrl={a.avatar_url}
                      size="xs"
                      className="ring-2 ring-card"
                    />
                  ))}
                </span>
                <span className="truncate text-[13px] font-medium text-foreground">
                  {assignees.map((a) => a.full_name).join(", ")}
                </span>
              </>
            )}
          </button>
        </PopoverTrigger>
        {assignees.length > 0 && (
          <button
            type="button"
            aria-label="Clear assignees"
            onClick={() => onChange([])}
            className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground/50 opacity-0 transition-opacity hover:bg-surface hover:text-muted-foreground group-hover/assignees:opacity-100"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
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
    <div className={cn("max-h-48 space-y-1 overflow-y-auto", previewScrollHidden)}>
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
  onChange,
}: {
  priority: string;
  onChange: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = TASK_PRIORITIES.find((p) => p.value === priority)?.label;
  const empty = isPriorityEmpty(priority);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={empty ? previewClickupEmpty : "text-[13px] font-medium text-foreground"}>
          {empty ? "Empty" : label}
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

function TimeEstimateField({
  estimatedHours,
  onChange,
}: {
  estimatedHours: number | null;
  onChange: (hours: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function openPopover(next: boolean) {
    setOpen(next);
    if (next) setDraft(estimatedHours != null ? String(estimatedHours) : "");
  }

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      onChange(null);
    } else {
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed) && parsed >= 0) onChange(parsed);
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={openPopover}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={estimatedHours == null ? previewClickupEmpty : "text-[13px] font-medium text-foreground"}
        >
          {estimatedHours == null ? "Empty" : `${estimatedHours}h`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-44 p-3")}>
        <label className="block text-[11px] font-medium text-muted-foreground">
          Hours
          <input
            type="number"
            min={0}
            step={0.25}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="e.g. 2"
          />
        </label>
        <div className="mt-3 flex gap-2">
          {estimatedHours != null && (
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-surface"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={save}
            className={cn(
              "rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-brand-foreground",
              estimatedHours != null ? "flex-1" : "w-full",
            )}
          >
            Save
          </button>
        </div>
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
          previewClickupTrackTime,
          "transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {isTracking ? (
          <>
            <span className={cn(previewClickupTrackTimePlay, "bg-danger/10")}>
              <Square className="size-2.5 fill-danger text-danger" />
            </span>
            <span className="tabular-nums">{formatDurationHuman(trackedSeconds)}</span>
          </>
        ) : (
          <>
            <span className={previewClickupTrackTimePlay}>
              <Play className="size-2.5 fill-muted-foreground text-muted-foreground" />
            </span>
            <span>{trackedSeconds > 0 ? formatDurationHuman(trackedSeconds) : "Start"}</span>
          </>
        )}
      </button>
    </TaskTimerHint>
  );
}
