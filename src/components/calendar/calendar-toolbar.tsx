import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CALENDAR_VIEWS, type CalendarView } from "@/lib/calendar/constants";
import { viewTitle } from "@/lib/calendar/date-utils";
import type { CalendarFilters, ProfileOption, ProjectOption } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type CalendarToolbarProps = {
  view: CalendarView;
  anchor: Date;
  filters: CalendarFilters;
  projects: ProjectOption[];
  profiles: ProfileOption[];
  showFilters?: boolean;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: -1 | 1) => void;
  onToday: () => void;
  onFiltersChange: (filters: CalendarFilters) => void;
};

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function CalendarToolbar({
  view,
  anchor,
  filters,
  projects,
  profiles,
  showFilters,
  onViewChange,
  onNavigate,
  onToday,
  onFiltersChange,
}: CalendarToolbarProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="size-8" onClick={() => onNavigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            onClick={onToday}
            className="bg-brand text-brand-foreground shadow-sm hover:brightness-110"
          >
            Today
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onNavigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h2 className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-foreground">
          {viewTitle(view, anchor)}
        </h2>
        <div className="flex rounded-lg border border-border bg-card p-1 shadow-sm">
          {CALENDAR_VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                view === v
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <FilterField label="Search" className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, project, notes, location…"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </FilterField>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Project">
              <Select
                value={filters.projectId ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, projectId: v === "all" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Assignee">
              <Select
                value={filters.assignedUserId ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, assignedUserId: v === "all" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? "Member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Created By">
              <Select
                value={filters.createdById ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, createdById: v === "all" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? "Member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Date Range" className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  aria-label="Start date"
                  value={filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateFrom: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null,
                    })
                  }
                  className="min-w-0 flex-1"
                />
                <span className="shrink-0 text-sm text-muted-foreground">→</span>
                <Input
                  type="date"
                  aria-label="End date"
                  value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateTo: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null,
                    })
                  }
                  className="min-w-0 flex-1"
                />
              </div>
            </FilterField>
          </div>
        </div>
      )}
    </div>
  );
}
