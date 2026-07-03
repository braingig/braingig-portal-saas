import type { ReactNode } from "react";
import { Calendar, CheckSquare, DollarSign, Pencil, User, Users } from "lucide-react";
import { DetailCard } from "@/components/projects/details/detail-card";
import { TaskActivityFeed } from "@/components/tasks/details/task-activity-feed";
import type { TaskPreviewAudit } from "@/components/tasks/preview/use-task-preview-data";
import { formatCurrency, formatDate, formatProjectTimeline, stripHtml } from "@/lib/format";
import { countDoneTasks, countOpenTasks } from "@/lib/projects/task-status";
import type { ProjectOwner, ProjectRecord, ProjectTask } from "@/lib/projects/types";

type ProjectDetailsSidebarProps = {
  project: ProjectRecord;
  owner: ProjectOwner | null;
  tasks: ProjectTask[];
  audits: TaskPreviewAudit[];
  nameOf: (id: string | null | undefined) => string;
  onEditNote?: () => void;
  noteSlot?: ReactNode;
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

export function ProjectDetailsSidebar({
  project,
  owner,
  tasks,
  audits,
  nameOf,
  onEditNote,
  noteSlot,
}: ProjectDetailsSidebarProps) {
  const notePlain = stripHtml(project.note);
  const hasNoteHtml = project.note && project.note !== notePlain;
  const doneCount = countDoneTasks(tasks);
  const openCount = countOpenTasks(tasks);

  return (
    <div className="space-y-4">
      <DetailCard title="Details">
        <div className="space-y-4">
          <DetailRow
            icon={CheckSquare}
            label="Tasks"
            value={
              <span>
                {doneCount} done · {openCount} open · {tasks.length} total
              </span>
            }
          />
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
            value={owner?.full_name ?? "Unknown"}
          />
        </div>
        {project.created_at && (
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            Created {formatDate(project.created_at)}
            {project.updated_at && (
              <> · Updated {formatDate(project.updated_at)}</>
            )}
          </p>
        )}
      </DetailCard>

      <DetailCard title="Activity">
        <TaskActivityFeed
          timeEntries={[]}
          comments={[]}
          audits={audits}
          nameOf={nameOf}
          sortDescending
          showHeader={false}
          previewCount={8}
        />
      </DetailCard>

      {noteSlot ? (
        <DetailCard
          title="Internal note"
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
          {noteSlot}
        </DetailCard>
      ) : (
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
      )}
    </div>
  );
}
