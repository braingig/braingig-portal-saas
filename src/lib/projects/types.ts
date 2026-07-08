export type ProjectMilestone = {
  id: string;
  title: string;
  project_id: string;
  position?: number;
};

export type ProjectOwner = {
  full_name: string | null;
  avatar_url: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  client: string | null;
  status: string;
  budget: number | null;
  hourly_rate: number | null;
  start_date?: string | null;
  end_date: string | null;
  due_date: string | null;
  tasks?: { id: string; status: string }[];
  time_entries?: { duration_seconds: number }[];
};

export type ProjectRecord = ProjectSummary & {
  description?: string | null;
  note?: string | null;
  attachment_url?: string | null;
  organization_id?: string | null;
  owner_id?: string | null;
  progress?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assignee_id: string | null;
  project_id: string | null;
  milestone_id?: string | null;
  profiles?: { full_name: string; avatar_url: string | null };
};

export type ProjectSubtask = Pick<ProjectTask, "id" | "title" | "status">;
