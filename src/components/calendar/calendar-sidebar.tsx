import { Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EVENT_TYPE_COLORS,
  LINKED_RECORD_LABELS,
  LINKED_RECORD_SOURCES,
  MANUAL_EVENT_TYPE_LABELS,
  MANUAL_EVENT_TYPES,
  type LinkedRecordSource,
  type ManualEventType,
} from "@/lib/calendar/constants";
import { canCreateHoliday } from "@/lib/calendar/permissions";
import type { AppRole } from "@/lib/users/permissions";
import type { CalendarFilters } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type CalendarSidebarProps = {
  selectedDate: Date;
  filters: CalendarFilters;
  role: AppRole;
  onDateSelect: (date: Date) => void;
  onFiltersChange: (filters: CalendarFilters) => void;
  onQuickCreate: (type: ManualEventType) => void;
};

function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function FilterRow({
  checked,
  color,
  label,
  onToggle,
}: {
  checked: boolean;
  color: string;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1.5 text-sm transition-colors hover:bg-surface/60">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className={cn("font-medium", !checked && "text-muted-foreground line-through")}>
        {label}
      </span>
    </label>
  );
}

export function CalendarSidebar({
  selectedDate,
  filters,
  role,
  onDateSelect,
  onFiltersChange,
  onQuickCreate,
}: CalendarSidebarProps) {
  const activeManual = new Set(filters.manualEventTypes);
  const activeLinked = new Set(filters.linkedRecords);

  function toggleManual(type: ManualEventType) {
    const next = new Set(activeManual);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    onFiltersChange({ ...filters, manualEventTypes: [...next] });
  }

  function toggleLinked(source: LinkedRecordSource) {
    const next = new Set(activeLinked);
    if (next.has(source)) next.delete(source);
    else next.add(source);
    onFiltersChange({ ...filters, linkedRecords: [...next] });
  }

  const hasActiveFilters = activeManual.size > 0 || activeLinked.size > 0;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-72">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-9 w-full gap-2 bg-brand text-brand-foreground shadow-sm hover:brightness-110">
            <Plus className="size-4" />
            Quick create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={() => onQuickCreate("meeting")}>Meeting</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onQuickCreate("reminder")}>Reminder</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onQuickCreate("personal")}>Personal Event</DropdownMenuItem>
          {canCreateHoliday(role) && (
            <DropdownMenuItem onClick={() => onQuickCreate("holiday")}>Holiday</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && onDateSelect(d)}
          className="mx-auto"
        />
      </div>

      <FilterSection title="Manual Events">
        {MANUAL_EVENT_TYPES.map((type) => {
          const checked = activeManual.size === 0 || activeManual.has(type);
          return (
            <FilterRow
              key={type}
              checked={checked}
              color={EVENT_TYPE_COLORS[type]}
              label={MANUAL_EVENT_TYPE_LABELS[type]}
              onToggle={() => toggleManual(type)}
            />
          );
        })}
      </FilterSection>

      <FilterSection
        title="Workspace Timeline"
        description="Automatically synced from Tasks, Projects and Leave modules."
      >
        {LINKED_RECORD_SOURCES.map((source) => {
          const checked = activeLinked.size === 0 || activeLinked.has(source);
          return (
            <FilterRow
              key={source}
              checked={checked}
              color={EVENT_TYPE_COLORS[source]}
              label={LINKED_RECORD_LABELS[source]}
              onToggle={() => toggleLinked(source)}
            />
          );
        })}
      </FilterSection>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onFiltersChange({ ...filters, manualEventTypes: [], linkedRecords: [] })
          }
          className="text-xs font-medium text-brand hover:underline"
        >
          Clear all filters
        </button>
      )}
    </aside>
  );
}
