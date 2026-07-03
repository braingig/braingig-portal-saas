import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TasksFiltersPopover } from "@/components/tasks/tasks-filters-popover";
import {
  tasksFilterSelectContent,
  tasksFilterSelectItem,
  tasksFilterTriggerSecondary,
  tasksFilterTriggerTertiary,
  tasksFilterWidth,
  tasksSearchInputClass,
  tasksSecondary,
} from "@/components/tasks/tasks-page-styles";
import { dsIconStroke } from "@/lib/design-system";
import { TasksViewSwitcher, type TasksViewMode } from "@/components/tasks/tasks-view-switcher";
import {
  TASKS_FILTER_ALL,
  TASKS_FILTER_STANDALONE,
  TASKS_FILTER_UNASSIGNED,
  type TasksListFilters,
} from "@/lib/tasks/filters";
import { TASK_STATUSES } from "@/lib/tasks/status";
import type { TaskOrgMember, TaskProjectOption } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TasksToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  projects: TaskProjectOption[];
  filters: TasksListFilters;
  onFiltersChange: (filters: TasksListFilters) => void;
  assignees: TaskOrgMember[];
  creators: TaskOrgMember[];
  viewMode: TasksViewMode;
  onViewModeChange: (mode: TasksViewMode) => void;
};

const SELECT_WIDTH = cn(tasksFilterWidth, "shrink-0");

export function TasksToolbar({
  searchQuery,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  filters,
  onFiltersChange,
  assignees,
  creators,
  viewMode,
  onViewModeChange,
}: TasksToolbarProps) {
  return (
    <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
      <div className="relative min-w-[160px] max-w-[240px] flex-1 shrink">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50"
          strokeWidth={dsIconStroke}
        />
        <input
          type="search"
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(tasksSearchInputClass(), "w-full pl-9 pr-3")}
        />
      </div>

      <Select value={projectFilter} onValueChange={onProjectFilterChange}>
        <SelectTrigger className={cn(tasksFilterTriggerSecondary, SELECT_WIDTH)}>
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent className={tasksFilterSelectContent}>
          <SelectItem value={TASKS_FILTER_ALL} className={tasksFilterSelectItem}>All projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id} className={tasksFilterSelectItem}>{project.name}</SelectItem>
          ))}
          <SelectItem value={TASKS_FILTER_STANDALONE} className={tasksFilterSelectItem}>Standalone</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.assigneeFilter}
        onValueChange={(v) => onFiltersChange({ ...filters, assigneeFilter: v })}
      >
        <SelectTrigger className={cn(tasksFilterTriggerSecondary, SELECT_WIDTH)}>
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent className={tasksFilterSelectContent}>
          <SelectItem value={TASKS_FILTER_ALL} className={tasksFilterSelectItem}>All assignees</SelectItem>
          <SelectItem value={TASKS_FILTER_UNASSIGNED} className={tasksFilterSelectItem}>Unassigned</SelectItem>
          {assignees.map((a) => (
            <SelectItem key={a.id} value={a.id} className={tasksFilterSelectItem}>{a.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.statusFilter}
        onValueChange={(v) => onFiltersChange({ ...filters, statusFilter: v })}
      >
        <SelectTrigger className={cn(tasksFilterTriggerSecondary, SELECT_WIDTH)}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className={tasksFilterSelectContent}>
          <SelectItem value={TASKS_FILTER_ALL} className={tasksFilterSelectItem}>All statuses</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s.key} value={s.key} className={tasksFilterSelectItem}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="shrink-0">
        <TasksFiltersPopover filters={filters} onChange={onFiltersChange} creators={creators} />
      </div>

      <div className="min-w-2 flex-1" aria-hidden />

      <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-1 py-0.5 transition-colors hover:bg-surface/40">
        <Checkbox
          checked={filters.myTasksOnly}
          onCheckedChange={(v) => onFiltersChange({ ...filters, myTasksOnly: Boolean(v) })}
          className="size-3.5"
        />
        <span className={tasksSecondary}>My tasks</span>
      </label>

      <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-1 py-0.5 transition-colors hover:bg-surface/40">
        <Checkbox
          checked={filters.hideCompleted}
          onCheckedChange={(v) => onFiltersChange({ ...filters, hideCompleted: Boolean(v) })}
          className="size-3.5"
        />
        <span className={tasksSecondary}>Hide completed</span>
      </label>

      <div className="shrink-0">
        <TasksViewSwitcher value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}

export {
  TASKS_FILTER_ALL,
  TASKS_FILTER_STANDALONE,
} from "@/lib/tasks/filters";
