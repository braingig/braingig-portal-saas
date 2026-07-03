export type JobPosting = {
  id: string;
  organization_id: string;
  title: string;
  department: string | null;
  description: string | null;
  status: string;
  hiring_manager_id: string | null;
  closing_date: string | null;
  open_positions: number;
  created_at: string;
  updated_at: string;
};

export type Candidate = {
  id: string;
  organization_id: string;
  job_posting_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  stage: string;
  notes: string | null;
  interview_at: string | null;
  interviewer_id: string | null;
  interviewer_name?: string | null;
  offer_sent_at: string | null;
  job_title?: string | null;
  created_at: string;
  updated_at: string;
};

export type RecruitmentMember = {
  user_id: string;
  full_name: string;
};

export type RecruitmentOverview = {
  openJobs: number;
  totalCandidates: number;
  interviewsScheduled: number;
  offersSent: number;
  hired: number;
};

export type RecruitmentPageData = {
  jobs: JobPosting[];
  candidates: Candidate[];
  members: RecruitmentMember[];
};

export type JobFormValues = {
  title: string;
  department: string;
  description: string;
  open_positions: number;
  closing_date: string;
};

export type CandidateFormValues = {
  full_name: string;
  email: string;
  phone: string;
  job_posting_id: string;
};

export type InterviewFormValues = {
  candidate_id: string;
  interview_at: string;
  interviewer_id: string;
};
