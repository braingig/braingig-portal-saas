import { supabase } from "@/integrations/supabase/client";
import { isMissingColumnError } from "@/lib/projects/upload-attachment";
import type {
  Candidate,
  CandidateFormValues,
  InterviewFormValues,
  JobFormValues,
  JobPosting,
  RecruitmentMember,
  RecruitmentPageData,
} from "@/lib/recruitment/types";

function mapJob(row: Record<string, unknown>): JobPosting {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    title: row.title as string,
    department: (row.department as string) ?? null,
    description: (row.description as string) ?? null,
    status: (row.status as string) ?? "open",
    hiring_manager_id: (row.hiring_manager_id as string) ?? null,
    closing_date: (row.closing_date as string) ?? null,
    open_positions: typeof row.open_positions === "number" ? row.open_positions : 1,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) ?? (row.created_at as string),
  };
}

function mapCandidate(row: Record<string, unknown>): Candidate {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    job_posting_id: (row.job_posting_id as string) ?? null,
    full_name: row.full_name as string,
    email: row.email as string,
    phone: (row.phone as string) ?? null,
    stage: (row.stage as string) ?? "applied",
    notes: (row.notes as string) ?? null,
    interview_at: (row.interview_at as string) ?? null,
    interviewer_id: (row.interviewer_id as string) ?? null,
    offer_sent_at: (row.offer_sent_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) ?? (row.created_at as string),
  };
}

async function fetchMembers(orgId: string): Promise<RecruitmentMember[]> {
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId);

  if (!memberRows?.length) return [];

  const ids = memberRows.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  return (profiles ?? [])
    .map((p) => ({ user_id: p.id, full_name: p.full_name ?? "Member" }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

function enrichCandidates(
  candidates: Candidate[],
  jobs: JobPosting[],
  members: RecruitmentMember[],
): Candidate[] {
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));
  const memberMap = new Map(members.map((m) => [m.user_id, m.full_name]));
  return candidates.map((c) => ({
    ...c,
    job_title: c.job_posting_id ? jobMap.get(c.job_posting_id) ?? null : null,
    interviewer_name: c.interviewer_id ? memberMap.get(c.interviewer_id) ?? null : null,
  }));
}

export async function loadRecruitmentPageData(orgId: string): Promise<RecruitmentPageData> {
  const [members, jobsRes, candidatesRes] = await Promise.all([
    fetchMembers(orgId),
    supabase
      .from("job_postings")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("candidates")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  const jobs = (jobsRes.data ?? []).map((row) => mapJob(row as Record<string, unknown>));
  const candidates = enrichCandidates(
    (candidatesRes.data ?? []).map((row) => mapCandidate(row as Record<string, unknown>)),
    jobs,
    members,
  );

  return { jobs, candidates, members };
}

export async function createJobPosting(
  orgId: string,
  userId: string,
  values: JobFormValues,
): Promise<{ error?: string; job?: JobPosting }> {
  const payload: Record<string, unknown> = {
    organization_id: orgId,
    title: values.title.trim(),
    department: values.department.trim() || null,
    description: values.description.trim() || null,
    status: "open",
    created_by: userId,
    open_positions: values.open_positions || 1,
    closing_date: values.closing_date || null,
  };

  let { data, error } = await supabase.from("job_postings").insert(payload).select("*").single();

  if (error && isMissingColumnError(error)) {
    delete payload.open_positions;
    delete payload.closing_date;
    ({ data, error } = await supabase.from("job_postings").insert(payload).select("*").single());
  }

  if (error || !data) return { error: error?.message ?? "Failed to create job." };
  return { job: mapJob(data as Record<string, unknown>) };
}

export async function createCandidate(
  orgId: string,
  userId: string,
  values: CandidateFormValues,
): Promise<{ error?: string; candidate?: Candidate }> {
  const payload = {
    organization_id: orgId,
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    job_posting_id: values.job_posting_id || null,
    created_by: userId,
    stage: "applied",
  };

  const { data, error } = await supabase.from("candidates").insert(payload).select("*").single();
  if (error || !data) return { error: error?.message ?? "Failed to add candidate." };
  return { candidate: mapCandidate(data as Record<string, unknown>) };
}

export async function updateCandidateStage(
  candidateId: string,
  stage: string,
): Promise<{ error?: string }> {
  const payload: Record<string, unknown> = { stage };
  if (stage === "offer") payload.offer_sent_at = new Date().toISOString();

  const { error } = await supabase.from("candidates").update(payload).eq("id", candidateId);

  if (error && isMissingColumnError(error)) {
    const { error: fallback } = await supabase.from("candidates").update({ stage }).eq("id", candidateId);
    if (fallback) return { error: fallback.message };
    return {};
  }

  if (error) return { error: error.message };
  return {};
}

export async function scheduleInterview(
  values: InterviewFormValues,
): Promise<{ error?: string }> {
  const payload: Record<string, unknown> = {
    interview_at: new Date(values.interview_at).toISOString(),
    interviewer_id: values.interviewer_id || null,
    stage: "interview",
  };

  const { error } = await supabase.from("candidates").update(payload).eq("id", values.candidate_id);

  if (error && isMissingColumnError(error)) {
    const { error: fallback } = await supabase
      .from("candidates")
      .update({ stage: "interview" })
      .eq("id", values.candidate_id);
    if (fallback) return { error: "Run the latest migration to schedule interviews with date and time." };
    return {};
  }

  if (error) return { error: error.message };
  return {};
}

export async function updateCandidateNotes(
  candidateId: string,
  notes: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("candidates").update({ notes: notes.trim() || null }).eq("id", candidateId);
  if (error) return { error: error.message };
  return {};
}

export async function updateJobStatus(
  jobId: string,
  status: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("job_postings").update({ status }).eq("id", jobId);
  if (error) return { error: error.message };
  return {};
}
