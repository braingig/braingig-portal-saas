import { supabase } from "@/integrations/supabase/client";
import { sendTaskMentionEmails } from "@/lib/email/notifications";

export type MentionContext = "description" | "note" | "comment";

const CONTEXT_LABEL: Record<MentionContext, string> = {
  description: "description",
  note: "note",
  comment: "comment",
};

export async function notifyTaskMentions({
  mentionIds,
  previousMentionIds = [],
  authorId,
  authorName,
  taskId,
  taskTitle,
  orgId,
  context,
  entityId,
}: {
  mentionIds: string[];
  previousMentionIds?: string[];
  authorId: string;
  authorName: string;
  taskId: string;
  taskTitle: string;
  orgId: string;
  context: MentionContext;
  entityId?: string;
}) {
  const previous = new Set(previousMentionIds);
  const recipients = mentionIds.filter((id) => id !== authorId && !previous.has(id));
  if (recipients.length === 0) return;

  const label = CONTEXT_LABEL[context];
  const rows = recipients.map((userId) => ({
    user_id: userId,
    organization_id: orgId,
    type: "mention",
    title: `${authorName} mentioned you`,
    body: `In the ${label} on task: ${taskTitle}`,
    link: `/tasks/${taskId}`,
    entity_type: context === "comment" ? "task_comment" : "task",
    entity_id: entityId ?? taskId,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.warn("Failed to create mention notifications:", error.message);

  await sendTaskMentionEmails({
    orgId,
    taskId,
    taskTitle,
    mentionUserIds: recipients,
    authorName,
    context,
  });
}
