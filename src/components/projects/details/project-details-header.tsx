import type { ReactNode } from "react";
import { Calendar, Pencil, Trash2, Users } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ProjectStatusPicker } from "@/components/projects/project-status-picker";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ProjectOwner, ProjectRecord } from "@/lib/projects/types";
import {
  projectIconSm,
  projectPageTitle,
  projectSecondary,
} from "@/components/projects/details/project-details-styles";
import { cn } from "@/lib/utils";

type ProjectDetailsHeaderProps = {
  project: ProjectRecord;
  owner: ProjectOwner | null;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
};

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", projectSecondary)}>
      <Icon className={cn(projectIconSm, "shrink-0 opacity-60")} />
      <span>{children}</span>
    </span>
  );
}

export function ProjectDetailsHeader({
  project,
  owner,
  onEdit,
  onDelete,
  onStatusChange,
}: ProjectDetailsHeaderProps) {
  const metaItems = [
    project.client ? (
      <MetaItem key="client" icon={Users}>
        {project.client}
      </MetaItem>
    ) : null,
    project.due_date ? (
      <MetaItem key="due" icon={Calendar}>
        Due {formatDate(project.due_date)}
      </MetaItem>
    ) : null,
    project.budget != null ? (
      <span key="budget" className={projectSecondary}>
        {formatCurrency(project.budget)}
      </span>
    ) : null,
  ].filter(Boolean);

  return (
    <header className="space-y-5 border-b border-border/40 pb-6">
      <BackLink to="/projects" className={cn(projectSecondary, "hover:text-foreground")}>
        Projects
      </BackLink>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn("min-w-0 break-words", projectPageTitle)}>{project.name}</h1>
            <ProjectStatusPicker
              status={project.status}
              onChange={onStatusChange}
              size="md"
            />
          </div>

          {(metaItems.length > 0 || owner) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {owner && project.owner_id && (
                <span className={cn("inline-flex items-center gap-2", projectSecondary)}>
                  <ProfileAvatar
                    userId={project.owner_id}
                    name={owner.full_name}
                    avatarUrl={owner.avatar_url}
                    size="xs"
                  />
                  <span>{owner.full_name ?? "Unknown"}</span>
                </span>
              )}
              {metaItems.length > 0 && owner && project.owner_id && (
                <span className="hidden h-3 w-px bg-border/60 sm:block" aria-hidden />
              )}
              {metaItems.map((item, index) => (
                <span key={index} className="contents">
                  {index > 0 && (
                    <span className="hidden h-3 w-px bg-border/60 sm:block" aria-hidden />
                  )}
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Edit project"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
            aria-label="Delete project"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
