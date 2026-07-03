import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tasksFilterSelectContent, tasksFilterSelectItem, tasksFilterTriggerSecondary, tasksFilterTriggerTertiary, tasksMeta } from "@/components/tasks/tasks-page-styles";
import { dsIconStroke, dsMetadata } from "@/lib/design-system";
import { TASK_PRIORITIES } from "@/lib/tasks/constants";
import {
  countActiveAdvancedFilters,
  DEFAULT_TASKS_ADVANCED_FILTERS,
  TASKS_FILTER_ALL,
  type TasksAdvancedFilters,
  type TasksDueDateFilter,
  type TasksListFilters,
  type TasksSortOption,
} from "@/lib/tasks/filters";
import { TASK_STATUSES } from "@/lib/tasks/status";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TasksFiltersPopoverProps = {
  filters: TasksListFilters;
  onChange: (filters: TasksListFilters) => void;
  creators: TaskOrgMember[];
};

const DUE_DATE_OPTIONS: { value: TasksDueDateFilter; label: string }[] = [
  { value: "all", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No due date" },
];

const SORT_OPTIONS: { value: TasksSortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "due_date", label: "Due date" },
  { value: "title", label: "Title A–Z" },
  { value: "priority", label: "Priority" },
];

export function TasksFiltersPopover({ filters, onChange, creators }: TasksFiltersPopoverProps) {
  const activeCount = countActiveAdvancedFilters(filters.advanced)
    + (filters.hideCompleted ? 1 : 0)
    + (filters.myTasksOnly ? 1 : 0);

  function patchAdvanced(patch: Partial<TasksAdvancedFilters>) {
    onChange({ ...filters, advanced: { ...filters.advanced, ...patch } });
  }

  function resetAdvanced() {
    onChange({
      ...filters,
      hideCompleted: false,
      myTasksOnly: false,
      advanced: DEFAULT_TASKS_ADVANCED_FILTERS,
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(tasksFilterTriggerTertiary, "cursor-pointer")}
        >
          <SlidersHorizontal className="size-4 shrink-0" strokeWidth={dsIconStroke} />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className={cn(dsMetadata, "rounded bg-brand/10 px-1.5 py-0.5 text-brand")}>
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 space-y-3.5 rounded-[11px] border-border/50 p-3 shadow-sm">
        <div className="space-y-2">
          <Label className={tasksMeta}>Priority</Label>
          <Select
            value={filters.advanced.priorityFilter}
            onValueChange={(v) => patchAdvanced({ priorityFilter: v })}
          >
            <SelectTrigger className={tasksFilterTriggerSecondary}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={tasksFilterSelectContent}>
              <SelectItem value={TASKS_FILTER_ALL} className={tasksFilterSelectItem}>All priorities</SelectItem>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value} className={tasksFilterSelectItem}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={tasksMeta}>Due date</Label>
          <Select
            value={filters.advanced.dueDateFilter}
            onValueChange={(v) => patchAdvanced({ dueDateFilter: v as TasksDueDateFilter })}
          >
            <SelectTrigger className={tasksFilterTriggerSecondary}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={tasksFilterSelectContent}>
              {DUE_DATE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className={tasksFilterSelectItem}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={tasksMeta}>Created by</Label>
          <Select
            value={filters.advanced.createdByFilter}
            onValueChange={(v) => patchAdvanced({ createdByFilter: v })}
          >
            <SelectTrigger className={tasksFilterTriggerSecondary}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={tasksFilterSelectContent}>
              <SelectItem value={TASKS_FILTER_ALL} className={tasksFilterSelectItem}>Anyone</SelectItem>
              {creators.map((c) => (
                <SelectItem key={c.id} value={c.id} className={tasksFilterSelectItem}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={tasksMeta}>Sort</Label>
          <Select
            value={filters.advanced.sortBy}
            onValueChange={(v) => patchAdvanced({ sortBy: v as TasksSortOption })}
          >
            <SelectTrigger className={tasksFilterTriggerSecondary}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={tasksFilterSelectContent}>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className={tasksFilterSelectItem}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 border-t border-border/40 pt-3">
          <Label className={cn(tasksMeta, "text-muted-foreground/70")}>Labels</Label>
          <p className={cn(tasksMeta, "text-muted-foreground/60")}>Not available yet</p>
        </div>

        <div className="space-y-2.5 border-t border-border/40 pt-3">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filters.hideCompleted}
              onCheckedChange={(v) => onChange({ ...filters, hideCompleted: Boolean(v) })}
            />
            <span className={tasksMeta}>Hide completed</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={filters.myTasksOnly}
              onCheckedChange={(v) => onChange({ ...filters, myTasksOnly: Boolean(v) })}
            />
            <span className={tasksMeta}>My tasks only</span>
          </label>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAdvanced}
            className={cn(tasksMeta, "w-full text-left transition-colors hover:text-foreground")}
          >
            Clear filters
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
