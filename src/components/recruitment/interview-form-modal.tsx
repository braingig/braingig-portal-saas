import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { INPUT_CLASS } from "@/components/attendance/attendance-styles";
import type { Candidate, InterviewFormValues, RecruitmentMember } from "@/lib/recruitment/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Candidate[];
  members: RecruitmentMember[];
  onSubmit: (values: InterviewFormValues) => Promise<void>;
};

export function InterviewFormModal({ open, onOpenChange, candidates, members, onSubmit }: Props) {
  const [candidateId, setCandidateId] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [saving, setSaving] = useState(false);

  const eligible = candidates.filter((c) => c.stage !== "rejected" && c.stage !== "hired");

  useEffect(() => {
    if (!open) {
      setCandidateId("");
      setInterviewAt("");
      setInterviewerId("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateId || !interviewAt) return;
    setSaving(true);
    try {
      await onSubmit({
        candidate_id: candidateId,
        interview_at: interviewAt,
        interviewer_id: interviewerId,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule Interview"
      description="Book an interview for a candidate."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="interview-form"
            size="sm"
            disabled={saving || !candidateId || !interviewAt}
            className="bg-brand text-brand-foreground"
          >
            {saving ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      }
    >
      <form id="interview-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Candidate</label>
          <select
            required
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select candidate</option>
            {eligible.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} {c.job_title ? `· ${c.job_title}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date & time</label>
          <input
            required
            type="datetime-local"
            value={interviewAt}
            onChange={(e) => setInterviewAt(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Interviewer</label>
          <select
            value={interviewerId}
            onChange={(e) => setInterviewerId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
      </form>
    </AppModal>
  );
}
