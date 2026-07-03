import type { Database } from "@/integrations/supabase/types";
import type { AttendanceMember } from "@/lib/attendance/types";

export type LeaveStatus = Database["public"]["Enums"]["leave_status"];

export type LeaveRequest = {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  half_day: boolean;
  attachment_url: string | null;
  review_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  reviewer_name?: string;
};

export type LeaveBalance = {
  leave_type: string;
  label: string;
  total: number;
  used: number;
  reserved: number;
  remaining: number;
};

export type LeaveOverview = {
  pending: number;
  approved: number;
  rejected: number;
  onLeaveToday: number;
};

export type LeaveFilters = {
  status: string;
  leaveType: string;
  userId: string;
  department: string;
  startDate: string;
  endDate: string;
};

export type LeaveFormValues = {
  leave_type: string;
  start_date: string;
  end_date: string;
  half_day: boolean;
  reason: string;
  attachment: File | null;
};

export type LeavePageData = {
  requests: LeaveRequest[];
  members: AttendanceMember[];
};

export type ReviewLeaveInput = {
  status: "approved" | "rejected";
  comment?: string;
};
