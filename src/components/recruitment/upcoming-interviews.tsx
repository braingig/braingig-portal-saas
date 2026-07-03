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
import { candidateInitials } from "@/lib/recruitment/calculations";
import type { Candidate } from "@/lib/recruitment/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = 5;

type PreviewProps = {
  interviews: Candidate[];
  onViewAll: () => void;
  onSelect: (candidate: Candidate) => void;
};

function formatInterviewTime(at: string | null): string {
  if (!at) return "TBD";
  const d = new Date(at);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function UpcomingInterviewsPreview({ interviews, onViewAll, onSelect }: PreviewProps) {
  const preview = interviews.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <RecruitmentSectionHeader title="Upcoming Interviews" actionLabel="View All" onAction={onViewAll} />
      <div className={preview.length === 0 ? "rounded-lg border border-border bg-card shadow-sm" : RECRUIT_DENSE_CARD}>
        {preview.length === 0 ? (
          <RecruitmentEmptyState
            title="No interviews scheduled."
            description="Schedule interviews from the pipeline or quick actions."
          />
        ) : (
          <div className="divide-y divide-border">
            {preview.map((c) => (
              <button key={c.id} type="button" className={RECRUIT_LIST_ITEM} onClick={() => onSelect(c)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                  <p className={RECRUIT_SECONDARY}>
                    {c.job_title ?? "—"} · {c.interviewer_name ?? "Unassigned"}
                  </p>
                  <p className={RECRUIT_SECONDARY}>
                    {c.interview_at ? formatDate(c.interview_at) : "Date TBD"} ·{" "}
                    {formatInterviewTime(c.interview_at)}
                  </p>
                </div>
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
  interviews: Candidate[];
  onSelect: (candidate: Candidate) => void;
};

export function InterviewsDrawer({ open, onOpenChange, interviews, onSelect }: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Upcoming Interviews</SheetTitle>
          <SheetDescription>{interviews.length} scheduled.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Candidate</TableHead>
                <TableHead className={TABLE_HEAD}>Position</TableHead>
                <TableHead className={TABLE_HEAD}>Interviewer</TableHead>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                <TableHead className={TABLE_HEAD}>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={cn(TABLE_CELL, "text-center text-muted-foreground")}>
                    No interviews scheduled.
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((c) => (
                  <TableRow
                    key={c.id}
                    className={cn(TABLE_ROW, "cursor-pointer hover:bg-muted/40")}
                    onClick={() => onSelect(c)}
                  >
                    <TableCell className={cn(TABLE_CELL, "font-medium")}>{c.full_name}</TableCell>
                    <TableCell className={TABLE_CELL}>{c.job_title ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL}>{c.interviewer_name ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL}>
                      {c.interview_at ? formatDate(c.interview_at) : "TBD"}
                    </TableCell>
                    <TableCell className={TABLE_CELL}>{formatInterviewTime(c.interview_at)}</TableCell>
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
