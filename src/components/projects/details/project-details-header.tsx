import { FolderKanban, Pencil, Trash2, Users } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { ProjectStatusPicker } from "@/components/projects/project-status-picker";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ProjectRecord } from "@/lib/projects/types";
import { dsProjectTitle } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type ProjectDetailsHeaderProps = {
  project: ProjectRecord;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
};

export function ProjectDetailsHeader({
  project,
  onEdit,
  onDelete,
  onStatusChange,
}: ProjectDetailsHeaderProps) {
  return (
    <div className="space-y-5">
      <BackLink to="/projects">Back to projects</BackLink>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <FolderKanban className="size-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className={cn("break-words", dsProjectTitle)}>
                {project.name}
              </h1>
              <ProjectStatusPicker
                status={project.status}
                onChange={onStatusChange}
                size="md"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px] text-xs text-muted-foreground">
            {project.client && (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                <Users className="size-3.5" />
                {project.client}
              </span>
            )}
            {project.budget != null && (
              <span>Budget {formatCurrency(project.budget)}</span>
            )}
            {project.due_date && (
              <span>Due {formatDate(project.due_date)}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Edit project"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
            aria-label="Delete project"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
