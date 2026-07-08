import { useState, type ReactNode } from "react";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectStatusPicker } from "@/components/projects/project-status-picker";
import {
  previewFieldLabel,
  previewFieldRow,
  previewFieldValueBtn,
  previewPopoverContent,
} from "@/components/tasks/preview/task-preview-styles";
import type { ProjectFormValues, ProjectStatus } from "@/lib/projects/constants";
import { cn } from "@/lib/utils";

type ProjectFormMetaProps = {
  values: ProjectFormValues;
  onChange: (values: ProjectFormValues) => void;
};

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
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

function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(previewFieldValueBtn, "text-sm text-foreground")}>
          {value.trim() ? <span className="truncate">{value}</span> : <EmptyValue>{placeholder}</EmptyValue>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn(previewPopoverContent, "w-56")}>
        <Input
          type={type}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.01" : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-border/60 bg-surface/40 text-sm"
          autoFocus
        />
        {value && (
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

function DateField({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = value
    ? (() => {
        const d = new Date(`${value}T12:00:00`);
        if (isToday(d)) return "Today";
        if (isPast(d)) return format(d, "MMM d");
        return format(d, "MMM d, yyyy");
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
          {label}
        </p>
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 border-border/60 bg-surface/40 text-sm"
        />
        {value && (
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

export function ProjectFormMeta({ values, onChange }: ProjectFormMetaProps) {
  function patch(partial: Partial<ProjectFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0 md:grid-cols-2 md:gap-x-6">
      <MetaRow icon={CheckCircle2} label="Status">
        <ProjectStatusPicker
          status={values.status}
          onChange={(status) => patch({ status: status as ProjectStatus })}
          size="sm"
        />
      </MetaRow>

      <MetaRow icon={Users} label="Client">
        <TextField
          value={values.client}
          onChange={(client) => patch({ client })}
          placeholder="Client name"
        />
      </MetaRow>

      <MetaRow icon={DollarSign} label="Budget">
        <TextField
          value={values.budget}
          onChange={(budget) => patch({ budget })}
          placeholder="0.00"
          type="number"
        />
      </MetaRow>

      <MetaRow icon={Timer} label="Hourly rate">
        <TextField
          value={values.hourlyRate}
          onChange={(hourlyRate) => patch({ hourlyRate })}
          placeholder="0.00"
          type="number"
        />
      </MetaRow>

      <MetaRow icon={Calendar} label="Start">
        <DateField
          value={values.startDate}
          label="Start date"
          onChange={(startDate) => patch({ startDate })}
        />
      </MetaRow>

      <MetaRow icon={Calendar} label="End">
        <DateField
          value={values.endDate}
          label="End date"
          onChange={(endDate) => patch({ endDate })}
        />
      </MetaRow>
    </div>
  );
}
