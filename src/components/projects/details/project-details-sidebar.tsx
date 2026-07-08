import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { DetailCard } from "@/components/projects/details/detail-card";
import { ExpandableDetailText } from "@/components/projects/details/expandable-detail-text";
import { TaskActivityFeed } from "@/components/tasks/details/task-activity-feed";
import { formatCurrency, formatDate, formatProjectTimeline } from "@/lib/format";
import {
  formatProjectActivityMessage,
  type ProjectActivityAudit,
} from "@/lib/projects/project-activity";
import { countDoneTasks, countOpenTasks } from "@/lib/projects/task-status";
import type { ProjectRecord, ProjectTask } from "@/lib/projects/types";
import {
  projectMeta,
  projectMuted,
  projectSecondary,
  projectTaskTitle,
} from "@/components/projects/details/project-details-styles";
import { cn } from "@/lib/utils";

type ProjectDetailsSidebarProps = {
  project: ProjectRecord;
  tasks: ProjectTask[];
  audits: ProjectActivityAudit[];
  taskTitles: Map<string, string>;
  nameOf: (id: string | null | undefined) => string;
  onEditNote?: () => void;
  noteSlot?: ReactNode;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className={cn("shrink-0", projectSecondary)}>{label}</dt>
      <dd className={cn("min-w-0 text-right font-medium", projectTaskTitle)}>{value}</dd>
    </div>
  );
}

function TaskStats({ tasks }: { tasks: ProjectTask[] }) {
  const doneCount = countDoneTasks(tasks);
  const openCount = countOpenTasks(tasks);
  const total = tasks.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground tabular-nums">
            {percent}%
          </p>
          <p className={cn("mt-0.5", projectMeta)}>complete</p>
        </div>
        <p className={cn("text-right", projectMeta)}>
          <span className="font-medium text-foreground">{doneCount}</span> done
          <span className="mx-1.5 text-border">·</span>
          <span className="font-medium text-foreground">{openCount}</span> open
          <span className="mx-1.5 text-border">·</span>
          <span className="font-medium text-foreground">{total}</span> total
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function ProjectDetailsSidebar({
  project,
  tasks,
  audits,
  taskTitles,
  nameOf,
  onEditNote,
  noteSlot,
}: ProjectDetailsSidebarProps) {
  return (
    <div className="space-y-5">
      <DetailCard title="Overview">
        <TaskStats tasks={tasks} />
        <dl className="mt-2 divide-y divide-border/30">
          <DetailRow label="Budget" value={formatCurrency(project.budget)} />
          <DetailRow label="Client" value={project.client || "—"} />
          <DetailRow
            label="Timeline"
            value={formatProjectTimeline(project.start_date, project.end_date, project.due_date)}
          />
        </dl>
        {project.created_at && (
          <p className={projectMeta}>
            Created {formatDate(project.created_at)}
            {project.updated_at && <> · Updated {formatDate(project.updated_at)}</>}
          </p>
        )}
      </DetailCard>

      <DetailCard title="Activity">
        <TaskActivityFeed
          timeEntries={[]}
          comments={[]}
          audits={audits}
          nameOf={nameOf}
          formatAuditMessage={(row, resolveName) =>
            formatProjectActivityMessage(row as ProjectActivityAudit, resolveName, taskTitles)
          }
          sortDescending
          showHeader={false}
          previewCount={5}
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
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label="Edit note"
              >
                <Pencil className="size-3.5" />
              </button>
            ) : undefined
          }
        >
          <ExpandableDetailText
            html={project.note}
            emptyMessage="No notes yet."
          />
        </DetailCard>
      )}
    </div>
  );
}
