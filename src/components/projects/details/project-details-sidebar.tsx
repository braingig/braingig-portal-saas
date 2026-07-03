import type { ReactNode } from "react";
import { Calendar, DollarSign, Pencil, User, Users } from "lucide-react";
import { DetailCard } from "@/components/projects/details/detail-card";
import { formatCurrency, formatDate, formatProjectTimeline, stripHtml } from "@/lib/format";
import type { ProjectRecord } from "@/lib/projects/types";

type ProjectOwner = {
  full_name: string | null;
  avatar_url: string | null;
};

type ProjectDetailsSidebarProps = {
  project: ProjectRecord;
  owner: ProjectOwner | null;
  onEditNote?: () => void;
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function ProjectDetailsSidebar({ project, owner, onEditNote }: ProjectDetailsSidebarProps) {
  const notePlain = stripHtml(project.note);
  const hasNoteHtml = project.note && project.note !== notePlain;

  return (
    <div className="space-y-4">
      <DetailCard title="Details">
        <div className="space-y-4">
          <DetailRow icon={DollarSign} label="Budget" value={formatCurrency(project.budget)} />
          <DetailRow icon={Users} label="Client" value={project.client || "Not set"} />
          <DetailRow
            icon={Calendar}
            label="Timeline"
            value={formatProjectTimeline(project.start_date, project.end_date, project.due_date)}
          />
          <DetailRow
            icon={User}
            label="Created by"
            value={
              owner?.full_name ? (
                <span className="font-medium">{owner.full_name}</span>
              ) : (
                "Unknown"
              )
            }
          />
        </div>
        {project.created_at && (
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            Created {formatDate(project.created_at)}
          </p>
        )}
      </DetailCard>

      <DetailCard
        title="Note"
        action={
          onEditNote ? (
            <button
              type="button"
              onClick={onEditNote}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Edit note"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : undefined
        }
      >
        {!notePlain && !hasNoteHtml ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : hasNoteHtml ? (
          <div
            className="text-sm leading-relaxed text-foreground [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: project.note! }}
          />
        ) : (
          <p className="text-sm leading-relaxed text-foreground">{notePlain}</p>
        )}
      </DetailCard>
    </div>
  );
}
