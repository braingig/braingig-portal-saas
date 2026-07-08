export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company: string | null
          created_at: string
          expected_close: string | null
          id: string
          name: string
          owner_id: string | null
          position: number
          stage: string
          updated_at: string
          value: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          expected_close?: string | null
          id?: string
          name: string
          owner_id?: string | null
          position?: number
          stage?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          expected_close?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          position?: number
          stage?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completion_percent: number
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          position: number
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completion_percent?: number
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          position?: number
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completion_percent?: number
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          position?: number
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          attachment_url: string | null
          budget: number | null
          client: string | null
          created_at: string
          description: string | null
          due_date: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          name: string
          note: string | null
          organization_id: string | null
          owner_id: string | null
          progress: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          budget?: number | null
          client?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          note?: string | null
          organization_id?: string | null
          owner_id?: string | null
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          budget?: number | null
          client?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          note?: string | null
          organization_id?: string | null
          owner_id?: string | null
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          mentions: string[]
          parent_id: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          mentions?: string[]
          parent_id?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          parent_id?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_due_reminder_log: {
        Row: {
          days_before: number
          due_date: string
          id: string
          sent_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          days_before: number
          due_date: string
          id?: string
          sent_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          days_before?: number
          due_date?: string
          id?: string
          sent_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_due_reminder_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_due_reminder_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_watchers: {
        Row: {
          created_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_watchers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completion_percent: number
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          parent_id: string | null
          position: number
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completion_percent?: number
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          parent_id?: string | null
          position?: number
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completion_percent?: number
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          parent_id?: string | null
          position?: number
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          project_id: string | null
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          project_id?: string | null
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          project_id?: string | null
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["org_status"]
          settings: Json
          logo_url: string | null
          website: string | null
          timezone: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["org_status"]
          settings?: Json
          logo_url?: string | null
          website?: string | null
          timezone?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["org_status"]
          settings?: Json
          logo_url?: string | null
          website?: string | null
          timezone?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          invited_by: string | null
          joined_at: string
          status: Database["public"]["Enums"]["member_status"]
          custom_permissions: string[] | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: Database["public"]["Enums"]["app_role"]
          invited_by?: string | null
          joined_at?: string
          status?: Database["public"]["Enums"]["member_status"]
          custom_permissions?: string[] | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          invited_by?: string | null
          joined_at?: string
          status?: Database["public"]["Enums"]["member_status"]
          custom_permissions?: string[] | null
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          expires_at: string
          accepted_at: string | null
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          expires_at?: string
          accepted_at?: string | null
          invited_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          expires_at?: string
          accepted_at?: string | null
          invited_by?: string
          created_at?: string
        }
        Relationships: []
      }
      organization_subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          seat_count: number
          trial_ends_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          seat_count?: number
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          seat_count?: number
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_monthly_cents: number
          price_yearly_cents: number
          max_seats: number
          features: Json
          stripe_price_monthly_id: string | null
          stripe_price_yearly_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_monthly_cents?: number
          price_yearly_cents?: number
          max_seats?: number
          features?: Json
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_monthly_cents?: number
          price_yearly_cents?: number
          max_seats?: number
          features?: Json
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: { user_id: string; created_at: string }
        Insert: { user_id: string; created_at?: string }
        Update: { user_id?: string; created_at?: string }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          full_name: string
          email: string
          department: string | null
          job_title: string | null
          hire_date: string | null
          salary_cents: number | null
          status: string
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          full_name: string
          email: string
          department?: string | null
          job_title?: string | null
          hire_date?: string | null
          salary_cents?: number | null
          status?: string
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          department?: string | null
          job_title?: string | null
          hire_date?: string | null
          salary_cents?: number | null
          status?: string
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          work_date: string | null
          clock_in: string | null
          clock_out: string | null
          status: string
          break_minutes: number
          working_minutes: number | null
          overtime_minutes: number
          late_minutes: number
          shift_id: string | null
          missed_checkout: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          work_date?: string | null
          clock_in?: string | null
          clock_out?: string | null
          status?: string
          break_minutes?: number
          working_minutes?: number | null
          overtime_minutes?: number
          late_minutes?: number
          shift_id?: string | null
          missed_checkout?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          work_date?: string | null
          clock_in?: string | null
          clock_out?: string | null
          status?: string
          break_minutes?: number
          working_minutes?: number | null
          overtime_minutes?: number
          late_minutes?: number
          shift_id?: string | null
          missed_checkout?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_breaks: {
        Row: {
          id: string
          record_id: string
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          record_id: string
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          record_id?: string
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      attendance_events: {
        Row: {
          id: string
          organization_id: string
          record_id: string | null
          user_id: string
          event_type: string
          occurred_at: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          record_id?: string | null
          user_id: string
          event_type: string
          occurred_at?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          record_id?: string | null
          user_id?: string
          event_type?: string
          occurred_at?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      work_shifts: {
        Row: {
          id: string
          organization_id: string
          name: string
          start_time: string
          end_time: string
          weekly_off_days: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          start_time?: string
          end_time?: string
          weekly_off_days?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          start_time?: string
          end_time?: string
          weekly_off_days?: number[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_shift_assignments: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          shift_id: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          shift_id: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          shift_id?: string
          created_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason: string | null
          status: Database["public"]["Enums"]["leave_status"]
          half_day: boolean
          attachment_url: string | null
          review_comment: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          leave_type?: string
          start_date: string
          end_date: string
          reason?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          half_day?: boolean
          attachment_url?: string | null
          review_comment?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          half_day?: boolean
          attachment_url?: string | null
          review_comment?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          id: string
          organization_id: string
          title: string
          department: string | null
          description: string | null
          status: string
          hiring_manager_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          department?: string | null
          description?: string | null
          status?: string
          hiring_manager_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          department?: string | null
          description?: string | null
          status?: string
          hiring_manager_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          id: string
          organization_id: string
          job_posting_id: string | null
          full_name: string
          email: string
          phone: string | null
          stage: string
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_posting_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          stage?: string
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_posting_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          stage?: string
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          id: string
          organization_id: string
          period_start: string
          period_end: string
          status: Database["public"]["Enums"]["payroll_status"]
          total_cents: number
          processed_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          period_start: string
          period_end: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_cents?: number
          processed_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          period_start?: string
          period_end?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_cents?: number
          processed_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_items: {
        Row: {
          id: string
          payroll_run_id: string
          employee_id: string
          gross_cents: number
          deductions_cents: number
          net_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          payroll_run_id: string
          employee_id: string
          gross_cents?: number
          deductions_cents?: number
          net_cents?: number
          created_at?: string
        }
        Update: {
          id?: string
          payroll_run_id?: string
          employee_id?: string
          gross_cents?: number
          deductions_cents?: number
          net_cents?: number
          created_at?: string
        }
        Relationships: []
      }
      document_folders: {
        Row: {
          id: string
          organization_id: string
          parent_id: string | null
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          parent_id?: string | null
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          parent_id?: string | null
          name?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          organization_id: string
          folder_id: string | null
          title: string
          content: string
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          folder_id?: string | null
          title: string
          content?: string
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          folder_id?: string | null
          title?: string
          content?: string
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_assets: {
        Row: {
          id: string
          organization_id: string
          folder_id: string | null
          name: string
          storage_path: string
          size_bytes: number
          mime_type: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          folder_id?: string | null
          name: string
          storage_path: string
          size_bytes?: number
          mime_type?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          folder_id?: string | null
          name?: string
          storage_path?: string
          size_bytes?: number
          mime_type?: string | null
          uploaded_by?: string
          created_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          start_at: string
          end_at: string
          all_day: boolean
          event_type: string
          color: string | null
          location: string | null
          notes: string | null
          user_id: string | null
          project_id: string | null
          task_id: string | null
          created_by: string
          recurrence: string
          recurrence_end_at: string | null
          recurrence_parent_id: string | null
          visibility: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          start_at: string
          end_at: string
          all_day?: boolean
          event_type?: string
          color?: string | null
          location?: string | null
          notes?: string | null
          user_id?: string | null
          project_id?: string | null
          task_id?: string | null
          created_by: string
          recurrence?: string
          recurrence_end_at?: string | null
          recurrence_parent_id?: string | null
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          start_at?: string
          end_at?: string
          all_day?: boolean
          event_type?: string
          color?: string | null
          location?: string | null
          notes?: string | null
          user_id?: string | null
          project_id?: string | null
          task_id?: string | null
          created_by?: string
          recurrence?: string
          recurrence_end_at?: string | null
          recurrence_parent_id?: string | null
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      calendar_event_reminders: {
        Row: {
          id: string
          event_id: string
          user_id: string
          offset_minutes: number
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          offset_minutes: number
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          offset_minutes?: number
          notified_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      create_organization: {
        Args: { _name: string; _slug: string }
        Returns: string
      }
      accept_organization_invite: {
        Args: { _token: string }
        Returns: string
      }
      is_platform_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _user_id: string; _org_id: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { _user_id: string; _org_id: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_any_org_role: {
        Args: { _user_id: string; _org_id: string; _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      get_organization_directory: {
        Args: { _org_id: string }
        Returns: {
          user_id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          job_title: string | null
          role: Database["public"]["Enums"]["app_role"]
          joined_at: string
          last_login_at: string | null
          member_status: Database["public"]["Enums"]["member_status"]
          custom_permissions: string[] | null
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "member"
        | "owner"
        | "hr"
        | "team_lead"
        | "employee"
        | "client"
      org_status: "trial" | "active" | "suspended" | "cancelled"
      subscription_status: "trialing" | "active" | "past_due" | "cancelled" | "incomplete"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      payroll_status: "draft" | "processing" | "paid" | "cancelled"
      member_status: "active" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "member",
        "owner",
        "hr",
        "team_lead",
        "employee",
        "client",
      ],
    },
  },
} as const
