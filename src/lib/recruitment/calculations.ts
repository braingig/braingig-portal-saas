import { PIPELINE_STAGES } from "@/lib/recruitment/constants";
import type { Candidate, JobPosting, RecruitmentOverview } from "@/lib/recruitment/types";

export function stageLabel(stage: string): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function computeOverview(jobs: JobPosting[], candidates: Candidate[]): RecruitmentOverview {
  const active = candidates.filter((c) => c.stage !== "rejected");
  return {
    openJobs: jobs.filter((j) => j.status === "open").length,
    totalCandidates: active.length,
    interviewsScheduled: active.filter((c) => c.stage === "interview" || c.interview_at).length,
    offersSent: active.filter((c) => c.stage === "offer" || c.offer_sent_at).length,
    hired: active.filter((c) => c.stage === "hired").length,
  };
}

export function groupCandidatesByPipelineStage(
  candidates: Candidate[],
): Record<string, Candidate[]> {
  const active = candidates.filter((c) => c.stage !== "rejected");
  const map: Record<string, Candidate[]> = {};
  for (const stage of PIPELINE_STAGES) {
    map[stage] = active.filter((c) => c.stage === stage);
  }
  return map;
}

export function sortJobsNewest(jobs: JobPosting[]): JobPosting[] {
  return [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function sortCandidatesNewest(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function upcomingInterviews(candidates: Candidate[], limit = 5): Candidate[] {
  const now = new Date().toISOString();
  return [...candidates]
    .filter((c) => c.stage !== "rejected" && c.stage !== "hired" && (c.interview_at || c.stage === "interview"))
    .sort((a, b) => {
      const aTime = a.interview_at ?? a.updated_at;
      const bTime = b.interview_at ?? b.updated_at;
      return aTime.localeCompare(bTime);
    })
    .filter((c) => !c.interview_at || c.interview_at >= now)
    .slice(0, limit);
}

export function openJobsPreview(jobs: JobPosting[], limit = 5): JobPosting[] {
  return sortJobsNewest(jobs.filter((j) => j.status === "open")).slice(0, limit);
}

export function recentCandidatesPreview(candidates: Candidate[], limit = 5): Candidate[] {
  return sortCandidatesNewest(candidates.filter((c) => c.stage !== "rejected")).slice(0, limit);
}

export function candidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
