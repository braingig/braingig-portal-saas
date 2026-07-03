export type TaskMilestone = {
  id: string;
  title: string;
  project_id: string;
};

export type TaskOrgMember = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  job_title?: string | null;
  email?: string | null;
};

export type TaskProjectOption = {
  id: string;
  name: string;
};

export type TaskListItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
  project_id: string | null;
  milestone_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  profiles?: { full_name: string; avatar_url: string | null; email?: string | null } | null;
  projects?: { name: string } | null;
};

export type TaskProjectGroup = {
  id: string;
  name: string;
  isStandalone?: boolean;
  tasks: TaskListItem[];
};

export type TaskDetailRecord = {
  id: string;
  title: string;
  description: string | null;
  note: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  project_id: string | null;
  milestone_id: string | null;
  parent_id: string | null;
  assignee_id: string | null;
  organization_id: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
};

export type TaskDetailProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  job_title?: string | null;
  email?: string | null;
};

export type TaskTimeEntry = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

export type TaskTimeEntryRow = TaskTimeEntry & {
  profile: TaskDetailProfile;
  isActive?: boolean;
};

export type TaskWorkerRow = {
  profile: TaskDetailProfile;
  totalSeconds: number;
  isAssignee: boolean;
};

export type TaskDailyTotal = {
  date: string;
  dayLabel: string;
  totalSeconds: number;
  entryCount: number;
  byPerson: { profile: TaskDetailProfile; seconds: number }[];
};
