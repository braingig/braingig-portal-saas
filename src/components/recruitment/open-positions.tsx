import { RecruitmentEmptyState } from "@/components/recruitment/recruitment-empty-state";
import { RecruitmentSectionHeader } from "@/components/recruitment/recruitment-section-header";
import {
  RECRUIT_DENSE_CARD,
  RECRUIT_LIST_ITEM,
  RECRUIT_SECONDARY,
} from "@/components/recruitment/recruitment-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_CELL, TABLE_HEAD, TABLE_ROW } from "@/components/attendance/attendance-styles";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/recruitment/constants";
import { sortJobsNewest } from "@/lib/recruitment/calculations";
import type { JobPosting } from "@/lib/recruitment/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = 5;

type PreviewProps = {
  jobs: JobPosting[];
  onViewAll: () => void;
  onSelect: (job: JobPosting) => void;
};

function JobStatusBadge({ status }: { status: string }) {
  const label = JOB_STATUS_LABELS[status] ?? status;
  const style = JOB_STATUS_STYLES[status] ?? JOB_STATUS_STYLES.open;
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", style)}>
      {label}
    </span>
  );
}

export function OpenPositionsPreview({ jobs, onViewAll, onSelect }: PreviewProps) {
  const preview = jobs.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <RecruitmentSectionHeader title="Open Positions" actionLabel="View All" onAction={onViewAll} />
      <div className={preview.length === 0 ? "rounded-lg border border-border bg-card shadow-sm" : RECRUIT_DENSE_CARD}>
        {preview.length === 0 ? (
          <RecruitmentEmptyState
            title="No open positions."
            description="Create a job to start hiring."
          />
        ) : (
          <div className="divide-y divide-border">
            {preview.map((job) => (
              <button key={job.id} type="button" className={RECRUIT_LIST_ITEM} onClick={() => onSelect(job)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{job.title}</p>
                  <p className={RECRUIT_SECONDARY}>
                    {job.department ?? "—"} · {job.open_positions} open
                    {job.closing_date ? ` · Closes ${formatDate(job.closing_date)}` : ""}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobPosting[];
  onSelect: (job: JobPosting) => void;
};

export function JobsDrawer({ open, onOpenChange, jobs, onSelect }: DrawerProps) {
  const sorted = sortJobsNewest(jobs);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>All Positions</SheetTitle>
          <SheetDescription>{sorted.length} job posting{sorted.length === 1 ? "" : "s"}.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Title</TableHead>
                <TableHead className={TABLE_HEAD}>Department</TableHead>
                <TableHead className={TABLE_HEAD}>Open</TableHead>
                <TableHead className={TABLE_HEAD}>Status</TableHead>
                <TableHead className={TABLE_HEAD}>Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={cn(TABLE_CELL, "text-center text-muted-foreground")}>
                    No jobs yet.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((job) => (
                  <TableRow
                    key={job.id}
                    className={cn(TABLE_ROW, "cursor-pointer hover:bg-muted/40")}
                    onClick={() => onSelect(job)}
                  >
                    <TableCell className={cn(TABLE_CELL, "font-medium")}>{job.title}</TableCell>
                    <TableCell className={TABLE_CELL}>{job.department ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL}>{job.open_positions}</TableCell>
                    <TableCell className={TABLE_CELL}>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className={TABLE_CELL}>{formatDate(job.closing_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
