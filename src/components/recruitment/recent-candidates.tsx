import { RecruitmentEmptyState } from "@/components/recruitment/recruitment-empty-state";
import { RecruitmentSectionHeader } from "@/components/recruitment/recruitment-section-header";
import {
  RECRUIT_DENSE_CARD,
  RECRUIT_LIST_ITEM,
  RECRUIT_SECONDARY,
} from "@/components/recruitment/recruitment-styles";
import { StageBadge } from "@/components/recruitment/stage-badge";
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
import { candidateInitials, sortCandidatesNewest } from "@/lib/recruitment/calculations";
import type { Candidate } from "@/lib/recruitment/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = 5;

type PreviewProps = {
  candidates: Candidate[];
  onViewAll: () => void;
  onSelect: (candidate: Candidate) => void;
};

export function RecentCandidatesPreview({ candidates, onViewAll, onSelect }: PreviewProps) {
  const preview = candidates.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <RecruitmentSectionHeader title="Recent Candidates" actionLabel="View All" onAction={onViewAll} />
      <div className={preview.length === 0 ? "rounded-lg border border-border bg-card shadow-sm" : RECRUIT_DENSE_CARD}>
        {preview.length === 0 ? (
          <RecruitmentEmptyState
            title="No candidates yet."
            description="Add candidates to build your hiring pipeline."
          />
        ) : (
          <div className="divide-y divide-border">
            {preview.map((c) => (
              <button key={c.id} type="button" className={RECRUIT_LIST_ITEM} onClick={() => onSelect(c)}>
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {candidateInitials(c.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                  <p className={RECRUIT_SECONDARY}>
                    {c.job_title ?? "No position"} · Applied {formatDate(c.created_at)}
                  </p>
                </div>
                <StageBadge stage={c.stage} />
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
  candidates: Candidate[];
  onSelect: (candidate: Candidate) => void;
};

export function CandidatesDrawer({ open, onOpenChange, candidates, onSelect }: DrawerProps) {
  const sorted = sortCandidatesNewest(candidates);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>All Candidates</SheetTitle>
          <SheetDescription>{sorted.length} candidate{sorted.length === 1 ? "" : "s"}.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className={TABLE_ROW}>
                <TableHead className={TABLE_HEAD}>Name</TableHead>
                <TableHead className={TABLE_HEAD}>Position</TableHead>
                <TableHead className={TABLE_HEAD}>Applied</TableHead>
                <TableHead className={TABLE_HEAD}>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className={cn(TABLE_CELL, "text-center text-muted-foreground")}>
                    No candidates yet.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((c) => (
                  <TableRow
                    key={c.id}
                    className={cn(TABLE_ROW, "cursor-pointer hover:bg-muted/40")}
                    onClick={() => onSelect(c)}
                  >
                    <TableCell className={cn(TABLE_CELL, "font-medium")}>{c.full_name}</TableCell>
                    <TableCell className={TABLE_CELL}>{c.job_title ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL}>{formatDate(c.created_at)}</TableCell>
                    <TableCell className={TABLE_CELL}>
                      <StageBadge stage={c.stage} />
                    </TableCell>
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
