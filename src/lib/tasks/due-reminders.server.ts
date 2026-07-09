import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTaskDueReminderNotification } from "@/lib/email/service.server";
import { taskLink, uniqueUserIds } from "@/lib/notifications/helpers";
import { formatDateInTimezone, isOrgReminderHour, normalizeTimezone } from "@/lib/timezone";

const REMINDER_DAYS = [7, 3, 1] as const;
type ReminderDaysBefore = (typeof REMINDER_DAYS)[number];

export type TaskDueRemindersResult = {
  organizationsProcessed: number;
  tasksMatched: number;
  notificationsCreated: number;
  emailsSent: number;
};

function addDaysToIsoDate(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatDueDateLabel(dueDate: string): string {
  const parsed = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function reminderTitle(daysBefore: ReminderDaysBefore): string {
  return daysBefore === 1 ? "Task due tomorrow" : `Task due in ${daysBefore} days`;
}

async function fetchTaskAssigneeIds(taskId: string, primaryAssigneeId: string | null): Promise<string[]> {
  const { data: assigneeRows } = await supabaseAdmin
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", taskId);

  const ids: string[] = [];
  if (primaryAssigneeId) ids.push(primaryAssigneeId);
  for (const row of assigneeRows ?? []) ids.push(row.user_id);
  return uniqueUserIds(ids);
}

async function fetchAlreadyNotifiedUserIds(
  taskId: string,
  daysBefore: ReminderDaysBefore,
  dueDate: string,
): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("task_due_reminder_log")
    .select("user_id")
    .eq("task_id", taskId)
    .eq("days_before", daysBefore)
    .eq("due_date", dueDate);

  if (error) {
    console.warn("[task-due-reminders] Failed to load reminder log:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.user_id));
}

export async function runTaskDueReminders(): Promise<TaskDueRemindersResult> {
  const result: TaskDueRemindersResult = {
    organizationsProcessed: 0,
    tasksMatched: 0,
    notificationsCreated: 0,
    emailsSent: 0,
  };

  const { data: organizations, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id, name, timezone");

  if (orgError) {
    throw new Error(`Failed to load organizations: ${orgError.message}`);
  }

  const now = new Date();

  for (const org of organizations ?? []) {
    const timezone = normalizeTimezone(org.timezone);
    if (!isOrgReminderHour(now, timezone)) continue;

    const today = formatDateInTimezone(now, timezone);
    const targets = REMINDER_DAYS.map((daysBefore) => ({
      daysBefore,
      dueDate: addDaysToIsoDate(today, daysBefore),
    }));
    const dueDates = targets.map((target) => target.dueDate);

    const { data: tasks, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select("id, title, due_date, assignee_id")
      .eq("organization_id", org.id)
      .in("due_date", dueDates)
      .neq("status", "done");

    if (taskError) {
      console.warn(`[task-due-reminders] Failed to load tasks for org ${org.id}:`, taskError.message);
      continue;
    }

    if (!tasks?.length) continue;
    result.organizationsProcessed += 1;

    for (const task of tasks) {
      if (!task.due_date) continue;

      const target = targets.find((entry) => entry.dueDate === task.due_date);
      if (!target) continue;

      const assigneeIds = await fetchTaskAssigneeIds(task.id, task.assignee_id);
      if (!assigneeIds.length) continue;

      const alreadyNotified = await fetchAlreadyNotifiedUserIds(
        task.id,
        target.daysBefore,
        task.due_date,
      );
      const recipients = assigneeIds.filter((userId) => !alreadyNotified.has(userId));
      if (!recipients.length) continue;

      result.tasksMatched += 1;
      const dueLabel = formatDueDateLabel(task.due_date);
      const title = reminderTitle(target.daysBefore);
      const body =
        target.daysBefore === 1
          ? `${task.title} is due tomorrow (${dueLabel})`
          : `${task.title} is due in ${target.daysBefore} days (${dueLabel})`;

      const { error: notificationError } = await supabaseAdmin.from("notifications").insert(
        recipients.map((userId) => ({
          user_id: userId,
          organization_id: org.id,
          type: "task_due_reminder",
          title,
          body,
          link: taskLink(task.id),
          entity_type: "task",
          entity_id: task.id,
        })),
      );

      if (notificationError) {
        console.warn(
          `[task-due-reminders] Failed in-app notifications for task ${task.id}:`,
          notificationError.message,
        );
        continue;
      }

      result.notificationsCreated += recipients.length;

      const emailResult = await sendTaskDueReminderNotification({
        orgId: org.id,
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.due_date,
        daysBefore: target.daysBefore,
        assigneeUserIds: recipients,
      });

      if (emailResult.sent) {
        result.emailsSent += emailResult.recipientCount ?? 0;
      }

      const { error: logError } = await supabaseAdmin.from("task_due_reminder_log").insert(
        recipients.map((userId) => ({
          task_id: task.id,
          user_id: userId,
          days_before: target.daysBefore,
          due_date: task.due_date,
        })),
      );

      if (logError) {
        console.warn(
          `[task-due-reminders] Failed to log reminders for task ${task.id}:`,
          logError.message,
        );
      }
    }
  }

  return result;
}
