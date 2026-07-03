import { useEffect, useState } from "react";
import { RECRUIT_SECONDARY } from "@/components/recruitment/recruitment-styles";
import { StageBadge } from "@/components/recruitment/stage-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { INPUT_CLASS } from "@/components/attendance/attendance-styles";
import { ALL_CANDIDATE_STAGES } from "@/lib/recruitment/constants";
import { candidateInitials } from "@/lib/recruitment/calculations";
import type { Candidate } from "@/lib/recruitment/types";
import { formatDate, formatDateTime } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  canManage?: boolean;
  onStageChange?: (stage: string) => Promise<void>;
  onNotesSave?: (notes: string) => Promise<void>;
};

export function CandidateDetailDrawer({
  open,
  onOpenChange,
  candidate,
  canManage,
  onStageChange,
  onNotesSave,
}: Props) {
  const [notes, setNotes] = useState(candidate?.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(candidate?.notes ?? "");
  }, [candidate?.id, candidate?.notes]);

  if (!candidate) return null;

  async function saveNotes() {
    if (!onNotesSave) return;
    setSavingNotes(true);
    try {
      await onNotesSave(notes);
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {candidateInitials(candidate.full_name)}
            </span>
            <div>
              <SheetTitle>{candidate.full_name}</SheetTitle>
              <SheetDescription>{candidate.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className={RECRUIT_SECONDARY}>Current stage</span>
            {canManage && onStageChange ? (
              <select
                value={candidate.stage}
                onChange={(e) => onStageChange(e.target.value)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
              >
                {ALL_CANDIDATE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <StageBadge stage={candidate.stage} />
            )}
          </div>

          <DetailRow label="Applied position" value={candidate.job_title ?? "—"} />
          <DetailRow label="Applied date" value={formatDate(candidate.created_at)} />
          <DetailRow label="Phone" value={candidate.phone ?? "—"} />

          {(candidate.interview_at || candidate.stage === "interview") && (
            <>
              <DetailRow
                label="Interview date"
                value={candidate.interview_at ? formatDate(candidate.interview_at) : "TBD"}
              />
              <DetailRow
                label="Interview time"
                value={
                  candidate.interview_at
                    ? new Date(candidate.interview_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "TBD"
                }
              />
              <DetailRow label="Interviewer" value={candidate.interviewer_name ?? "—"} />
            </>
          )}

          {(candidate.offer_sent_at || candidate.stage === "offer") && (
            <DetailRow
              label="Offer sent"
              value={candidate.offer_sent_at ? formatDateTime(candidate.offer_sent_at) : "Pending"}
            />
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Notes</p>
            {canManage && onNotesSave ? (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Interview feedback, offer details…"
                />
                <Button type="button" size="sm" variant="outline" disabled={savingNotes} onClick={saveNotes}>
                  {savingNotes ? "Saving…" : "Save notes"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-foreground">{candidate.notes || "No notes."}</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <span className={RECRUIT_SECONDARY}>{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
