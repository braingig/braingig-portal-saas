import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Flag,
  FolderKanban,
  FolderOpen,
  Hourglass,
  Play,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  previewFieldLabel,
  previewFieldRow,
  previewFieldValueBtn,
  previewPopoverContent,
} from "@/components/tasks/preview/task-preview-styles";
import { TASK_PRIORITIES, type TaskFormValues, type TaskPriority } from "@/lib/tasks/constants";
import { getTaskStatusMeta, TASK_STATUSES, TASK_STATUS_PILL } from "@/lib/tasks/status";
import type { TaskMilestone, TaskOrgMember, TaskProjectOption } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskFormMetaProps = {
  values: TaskFormValues;
  onChange: (values: TaskFormValues) => void;
  members: TaskOrgMember[];
  projects: TaskProjectOption[];
  milestones: TaskMilestone[];
  loadingFolders: boolean;
  isSubtask?: boolean;
};

export function TaskFormMeta({
  values,
  onChange,
  members,
  projects,
  milestones,
  loadingFolders,
  isSubtask = false,
}: TaskFormMetaProps) {
  function patch(partial: Partial<TaskFormValues>) {
    onChange({ ...values, ...partial });
  }

  const assigneeProfiles = members.filter((m) => values.assigneeIds.includes(m.id));
  const statusMeta = getTaskStatusMeta(values.status);
  const statusPill = TASK_STATUS_PILL[values.status] ?? TASK_STATUS_PILL.todo;

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2 md:gap-x-6 xl:grid-cols-3 xl:gap-x-8">
      <MetaRow icon={CheckCircle2} label="Status">
        <StatusField
          status={values.status}
          label={statusMeta.label}
          pillClass={statusPill}
          onChange={(status) => patch({ status })}
        />
      </MetaRow>

      <MetaRow icon={Flag} label="Priority">
        <PriorityField
          priority={values.priority}
          onChange={(priority) => patch({ priority })}
        />
      </MetaRow>

      {!isSubtask && (
        <>
          <MetaRow icon={FolderKanban} label="Project">
            <ProjectField
              projectId={values.projectId}
              projects={projects}
              onChange={(projectId) => patch({ projectId, milestoneId: "" })}
            />
          </MetaRow>

          <MetaRow icon={FolderOpen} label="Folder">
            <FolderField
              milestoneId={values.milestoneId}
              milestones={milestones}
              loading={loadingFolders}
              disabled={!values.projectId}
              onChange={(milestoneId) => patch({ milestoneId })}
            />
          </MetaRow>
        </>
      )}

      <MetaRow icon={User} label="Assignees">
        <AssigneeField
          assignees={assigneeProfiles}
          members={members}
          selectedIds={values.assigneeIds}
          onChange={(assigneeIds) => patch({ assigneeIds })}
        />
      </MetaRow>

      <MetaRow icon={Play} label="Start date">
        <StartDateField
          startDate={values.startDate}
          onChange={(startDate) => patch({ startDate })}
        />
      </MetaRow>

      <MetaRow icon={Calendar} label="Due date">
        <DueDateField
          dueDate={values.dueDate}
          onChange={(dueDate) => patch({ dueDate })}
        />
      </MetaRow>

      <MetaRow icon={Hourglass} label="Time Estimate">
        <EstimateField
          hours={values.estimatedHours}
          onChange={(estimatedHours) => patch({ estimatedHours })}
        />
      </MetaRow>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
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
  return <span className="text-sm text-muted-foreground/80">{children ?? "Empty"}</span>;
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
            onClick={() => {
              onChange(s.key);
              setOpen(false);
            }}
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

function PriorityField({
  priority,
  onChange,
}: {
  priority: TaskPriority;
  onChange: (p: TaskPriority) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm capitalize text-foreground")}>
          {priority || <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-40 p-1")}>
        {TASK_PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              onChange(p.value);
              setOpen(false);
            }}
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

function ProjectField({
  projectId,
  projects,
  onChange,
}: {
  projectId: string;
  projects: TaskProjectOption[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => p.id === projectId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {selected ? selected.name : <EmptyValue>Standalone</EmptyValue>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-52 p-1")}>
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className={cn(
            "w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/55 dark:hover:bg-surface/70",
            !projectId && "bg-muted/40 font-medium dark:bg-surface/60",
          )}
        >
          Standalone
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onChange(p.id);
              setOpen(false);
            }}
            className={cn(
              "w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/55 dark:hover:bg-surface/70",
              p.id === projectId && "bg-muted/40 font-medium dark:bg-surface/60",
            )}
          >
            {p.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function FolderField({
  milestoneId,
  milestones,
  loading,
  disabled,
  onChange,
}: {
  milestoneId: string;
  milestones: TaskMilestone[];
  loading: boolean;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = milestones.find((m) => m.id === milestoneId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            previewFieldValueBtn,
            "text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? (
            <EmptyValue>Loading…</EmptyValue>
          ) : selected ? (
            selected.title
          ) : (
            <EmptyValue>{disabled ? "Select project" : "No folder"}</EmptyValue>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(previewPopoverContent, "w-52 p-1")}>
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className={cn(
            "w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/55 dark:hover:bg-surface/70",
            !milestoneId && "bg-muted/40 font-medium dark:bg-surface/60",
          )}
        >
          No folder
        </button>
        {milestones.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              onChange(m.id);
              setOpen(false);
            }}
            className={cn(
              "w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/55 dark:hover:bg-surface/70",
              m.id === milestoneId && "bg-muted/40 font-medium dark:bg-surface/60",
            )}
          >
            {m.title}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function AssigneeField({
  assignees,
  members,
  selectedIds,
  onChange,
}: {
  assignees: TaskOrgMember[];
  members: TaskOrgMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = members.filter((m) => !selectedIds.includes(m.id));

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
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {assignees.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
              <div className="flex items-center gap-2">
                <ProfileAvatar userId={a.id} name={a.full_name} avatarUrl={a.avatar_url} size="xs" />
                <span className="text-sm">{a.full_name}</span>
              </div>
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((id) => id !== a.id))}
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
              onClick={() => onChange([...selectedIds, m.id])}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted/55 dark:hover:bg-surface/70"
            >
              <ProfileAvatar userId={m.id} name={m.full_name} avatarUrl={m.avatar_url} size="xs" />
              {m.full_name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StartDateField({
  startDate,
  onChange,
}: {
  startDate: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = startDate
    ? (() => {
        const d = new Date(`${startDate}T12:00:00`);
        if (isToday(d)) return "Today";
        if (isPast(d)) return format(d, "MMM d");
        return format(d, "MMM d");
      })()
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {display ? <span>{display}</span> : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn(previewPopoverContent, "w-52")}>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Start date
        </p>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-border/60 bg-surface/40 text-sm"
        />
        {startDate && (
          <button
            type="button"
            onClick={() => {
              onChange("");
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

function DueDateField({
  dueDate,
  onChange,
}: {
  dueDate: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = dueDate
    ? (() => {
        const d = new Date(`${dueDate}T12:00:00`);
        if (isToday(d)) return "Today";
        if (isPast(d)) return format(d, "MMM d");
        return format(d, "MMM d");
      })()
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {display ? <span>{display}</span> : <EmptyValue />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn(previewPopoverContent, "w-52")}>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Due date
        </p>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-border/60 bg-surface/40 text-sm"
        />
        {dueDate && (
          <button
            type="button"
            onClick={() => {
              onChange("");
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

function EstimateField({
  hours,
  onChange,
}: {
  hours: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {hours ? `${hours}h` : <EmptyValue />}
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
          value={hours}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-border/60 bg-surface/40 text-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
