export const PIPELINE_STAGES = ["applied", "screening", "interview", "offer", "hired"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const ALL_CANDIDATE_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;
export type CandidateStage = (typeof ALL_CANDIDATE_STAGES)[number];

export const JOB_STATUSES = ["open", "closed", "paused"] as const;

export const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const STAGE_STYLES: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  screening: "bg-brand/10 text-brand",
  interview: "bg-warning/10 text-warning",
  offer: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  hired: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  paused: "Paused",
};

export const JOB_STATUS_STYLES: Record<string, string> = {
  open: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
  paused: "bg-warning/10 text-warning",
};
