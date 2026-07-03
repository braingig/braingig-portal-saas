import { supabase } from "@/integrations/supabase/client";
import { extractMentionIds } from "@/lib/tasks/comment-mentions";
import { notifyTaskMentions } from "@/lib/tasks/mention-notifications";
import { fetchProfileEmails, withProfileEmail } from "@/lib/profile-emails";
import type { TaskDetailProfile, TaskOrgMember } from "@/lib/tasks/types";

export type TaskCommentRecord = {
  id: string;
  task_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  author?: TaskDetailProfile;
};

export type TaskCommentNode = TaskCommentRecord & {
  replies: TaskCommentNode[];
};

const COMMENT_SELECT = "id, task_id, parent_id, author_id, body, mentions, created_at, updated_at";

export function buildCommentTree(comments: TaskCommentRecord[]): TaskCommentNode[] {
  const byId = new Map<string, TaskCommentNode>();
  const roots: TaskCommentNode[] = [];

  for (const comment of comments) {
    byId.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const node = byId.get(comment.id)!;
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function countComments(nodes: TaskCommentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countComments(node.replies), 0);
}

export async function fetchTaskComments(
  taskId: string,
  orgId: string,
): Promise<TaskCommentRecord[]> {
  const { data, error } = await supabase
    .from("task_comments")
    .select(COMMENT_SELECT)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Omit<TaskCommentRecord, "author">[];
  if (rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .in("id", authorIds);

  if (profilesError) throw new Error(profilesError.message);

  const emailMap = await fetchProfileEmails(orgId, authorIds);
  const profileById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      withProfileEmail(
        {
          id: profile.id,
          full_name: profile.full_name ?? "Member",
          avatar_url: profile.avatar_url,
          job_title: profile.job_title ?? null,
        },
        emailMap,
      ),
    ]),
  );

  return rows.map((row) => ({
    ...row,
    author: profileById.get(row.author_id),
  }));
}

async function notifyMentionedUsers(args: {
  mentionIds: string[];
  authorId: string;
  authorName: string;
  taskId: string;
  taskTitle: string;
  orgId: string;
  commentId: string;
}) {
  await notifyTaskMentions({
    mentionIds: args.mentionIds,
    authorId: args.authorId,
    authorName: args.authorName,
    taskId: args.taskId,
    taskTitle: args.taskTitle,
    orgId: args.orgId,
    context: "comment",
    entityId: args.commentId,
  });
}

export async function createTaskComment({
  taskId,
  authorId,
  authorName,
  taskTitle,
  orgId,
  body,
  parentId,
  members,
}: {
  taskId: string;
  authorId: string;
  authorName: string;
  taskTitle: string;
  orgId: string;
  body: string;
  parentId?: string | null;
  members: TaskOrgMember[];
}): Promise<TaskCommentRecord> {
  const mentions = extractMentionIds(body, members);

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      author_id: authorId,
      body,
      parent_id: parentId ?? null,
      mentions,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  await notifyMentionedUsers({
    mentionIds: mentions,
    authorId,
    authorName,
    taskId,
    taskTitle,
    orgId,
    commentId: data.id,
  });

  return data as TaskCommentRecord;
}

export async function updateTaskComment({
  commentId,
  body,
  members,
  authorId,
  authorName,
  taskId,
  taskTitle,
  orgId,
}: {
  commentId: string;
  body: string;
  members: TaskOrgMember[];
  authorId: string;
  authorName: string;
  taskId: string;
  taskTitle: string;
  orgId: string;
}): Promise<void> {
  const mentions = extractMentionIds(body, members);

  const { error } = await supabase
    .from("task_comments")
    .update({ body, mentions })
    .eq("id", commentId);

  if (error) throw new Error(error.message);

  await notifyMentionedUsers({
    mentionIds: mentions,
    authorId,
    authorName,
    taskId,
    taskTitle,
    orgId,
    commentId,
  });
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("task_comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
}
