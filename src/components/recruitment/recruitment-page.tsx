import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CandidateDetailDrawer } from "@/components/recruitment/candidate-detail-drawer";
import { CandidateFormModal } from "@/components/recruitment/candidate-form-modal";
import {
  FullPipelineDrawer,
  HiringPipelinePreview,
  PipelineStageDrawer,
} from "@/components/recruitment/hiring-pipeline";
import { InterviewFormModal } from "@/components/recruitment/interview-form-modal";
import { JobDetailDrawer } from "@/components/recruitment/job-detail-drawer";
import { JobFormModal } from "@/components/recruitment/job-form-modal";
import { JobsDrawer, OpenPositionsPreview } from "@/components/recruitment/open-positions";
import { RecruitmentQuickActions } from "@/components/recruitment/recruitment-quick-actions";
import { CandidatesDrawer, RecentCandidatesPreview } from "@/components/recruitment/recent-candidates";
import { RecruitmentSummaryCards } from "@/components/recruitment/recruitment-summary-cards";
import { RECRUIT_SECTION_STACK } from "@/components/recruitment/recruitment-styles";
import { InterviewsDrawer, UpcomingInterviewsPreview } from "@/components/recruitment/upcoming-interviews";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import {
  computeOverview,
  openJobsPreview,
  recentCandidatesPreview,
  upcomingInterviews,
} from "@/lib/recruitment/calculations";
import { canManageRecruitment } from "@/lib/recruitment/permissions";
import {
  createCandidate,
  createJobPosting,
  loadRecruitmentPageData,
  scheduleInterview,
  updateCandidateNotes,
  updateCandidateStage,
  updateJobStatus,
} from "@/lib/recruitment/queries";
import type { Candidate, JobPosting } from "@/lib/recruitment/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RecruitmentPageContent() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { primary: role } = useRoles();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [members, setMembers] = useState<{ user_id: string; full_name: string }[]>([]);

  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const [jobsDrawerOpen, setJobsDrawerOpen] = useState(false);
  const [candidatesDrawerOpen, setCandidatesDrawerOpen] = useState(false);
  const [interviewsDrawerOpen, setInterviewsDrawerOpen] = useState(false);
  const [pipelineDrawerOpen, setPipelineDrawerOpen] = useState(false);
  const [stageDrawerOpen, setStageDrawerOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [candidateDetailOpen, setCandidateDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const canManage = canManageRecruitment(role);

  const overview = useMemo(() => computeOverview(jobs, candidates), [jobs, candidates]);
  const openJobs = useMemo(() => openJobsPreview(jobs), [jobs]);
  const recentCandidates = useMemo(() => recentCandidatesPreview(candidates), [candidates]);
  const interviews = useMemo(() => upcomingInterviews(candidates, 50), [candidates]);
  const interviewsPreview = useMemo(() => upcomingInterviews(candidates, 5), [candidates]);

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await loadRecruitmentPageData(orgId);
      setJobs(data.jobs);
      setCandidates(data.candidates);
      setMembers(data.members);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load recruitment data.");
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`recruitment-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_postings", filter: `organization_id=eq.${orgId}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates", filter: `organization_id=eq.${orgId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, load]);

  function openJob(job: JobPosting) {
    setSelectedJob(job);
    setJobDetailOpen(true);
  }

  function openCandidate(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setCandidateDetailOpen(true);
  }

  function openStage(stage: string) {
    setSelectedStage(stage);
    setStageDrawerOpen(true);
  }

  async function handleCreateJob(values: Parameters<typeof createJobPosting>[2]) {
    if (!user || !orgId) return;
    const result = await createJobPosting(orgId, user.id, values);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Job created.");
    await load();
  }

  async function handleAddCandidate(values: Parameters<typeof createCandidate>[2]) {
    if (!user || !orgId) return;
    const result = await createCandidate(orgId, user.id, values);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Candidate added.");
    await load();
  }

  async function handleScheduleInterview(values: Parameters<typeof scheduleInterview>[0]) {
    const result = await scheduleInterview(values);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Interview scheduled.");
    await load();
  }

  async function handleStageChange(stage: string) {
    if (!selectedCandidate) return;
    const result = await updateCandidateStage(selectedCandidate.id, stage);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Stage updated.");
    setCandidateDetailOpen(false);
    await load();
  }

  async function handleNotesSave(notes: string) {
    if (!selectedCandidate) return;
    const result = await updateCandidateNotes(selectedCandidate.id, notes);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Notes saved.");
    await load();
  }

  async function handleJobStatusChange(status: string) {
    if (!selectedJob) return;
    const result = await updateJobStatus(selectedJob.id, status);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Job status updated.");
    setJobDetailOpen(false);
    await load();
  }

  if (!orgId) {
    return (
      <AppShell title="Recruitment">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Recruitment"
      subtitle="Manage jobs, candidates and hiring."
      actions={
        canManage ? (
          <Button
            className="h-8 bg-brand text-brand-foreground hover:brightness-110"
            size="sm"
            onClick={() => setJobFormOpen(true)}
          >
            <Plus className="mr-1.5 size-3.5" />
            Create Job
          </Button>
        ) : undefined
      }
    >
      <div className={RECRUIT_SECTION_STACK}>
        <RecruitmentSummaryCards overview={overview} />
        <HiringPipelinePreview
          candidates={candidates}
          onStageClick={openStage}
          onOpenPipeline={() => setPipelineDrawerOpen(true)}
        />
        <div className="grid gap-7 lg:grid-cols-2">
          <OpenPositionsPreview
            jobs={openJobs}
            onViewAll={() => setJobsDrawerOpen(true)}
            onSelect={openJob}
          />
          <UpcomingInterviewsPreview
            interviews={interviewsPreview}
            onViewAll={() => setInterviewsDrawerOpen(true)}
            onSelect={openCandidate}
          />
        </div>
        <RecentCandidatesPreview
          candidates={recentCandidates}
          onViewAll={() => setCandidatesDrawerOpen(true)}
          onSelect={openCandidate}
        />
        <RecruitmentQuickActions
          canManage={canManage}
          onCreateJob={() => setJobFormOpen(true)}
          onAddCandidate={() => setCandidateFormOpen(true)}
          onScheduleInterview={() => setInterviewFormOpen(true)}
          onOpenPipeline={() => setPipelineDrawerOpen(true)}
        />
      </div>

      {canManage && (
        <>
          <JobFormModal open={jobFormOpen} onOpenChange={setJobFormOpen} onSubmit={handleCreateJob} />
          <CandidateFormModal
            open={candidateFormOpen}
            onOpenChange={setCandidateFormOpen}
            jobs={jobs}
            onSubmit={handleAddCandidate}
          />
          <InterviewFormModal
            open={interviewFormOpen}
            onOpenChange={setInterviewFormOpen}
            candidates={candidates}
            members={members}
            onSubmit={handleScheduleInterview}
          />
        </>
      )}

      <JobsDrawer
        open={jobsDrawerOpen}
        onOpenChange={setJobsDrawerOpen}
        jobs={jobs}
        onSelect={(job) => {
          setJobsDrawerOpen(false);
          openJob(job);
        }}
      />
      <CandidatesDrawer
        open={candidatesDrawerOpen}
        onOpenChange={setCandidatesDrawerOpen}
        candidates={candidates}
        onSelect={(c) => {
          setCandidatesDrawerOpen(false);
          openCandidate(c);
        }}
      />
      <InterviewsDrawer
        open={interviewsDrawerOpen}
        onOpenChange={setInterviewsDrawerOpen}
        interviews={interviews}
        onSelect={(c) => {
          setInterviewsDrawerOpen(false);
          openCandidate(c);
        }}
      />
      <FullPipelineDrawer
        open={pipelineDrawerOpen}
        onOpenChange={setPipelineDrawerOpen}
        candidates={candidates}
        onStageClick={(stage) => {
          setPipelineDrawerOpen(false);
          openStage(stage);
        }}
      />
      <PipelineStageDrawer
        open={stageDrawerOpen}
        onOpenChange={setStageDrawerOpen}
        stage={selectedStage}
        candidates={candidates}
        onSelect={(c) => {
          setStageDrawerOpen(false);
          openCandidate(c);
        }}
      />
      <JobDetailDrawer
        open={jobDetailOpen}
        onOpenChange={setJobDetailOpen}
        job={selectedJob}
        candidates={candidates}
        canManage={canManage}
        onStatusChange={handleJobStatusChange}
      />
      <CandidateDetailDrawer
        open={candidateDetailOpen}
        onOpenChange={setCandidateDetailOpen}
        candidate={selectedCandidate}
        canManage={canManage}
        onStageChange={handleStageChange}
        onNotesSave={handleNotesSave}
      />
    </AppShell>
  );
}
