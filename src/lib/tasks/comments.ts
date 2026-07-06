import { supabase } from "@/integrations/supabase/client";
import { extractMentionIds } from "@/lib/tasks/comment-mentions";
import { deleteTaskAttachmentsByIds } from "@/lib/tasks/attachments";
import { extractAttachmentIdsFromBodies, getCommentDisplayText } from "@/lib/tasks/comment-attachments";
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

/** Top-level comments only (threads), excluding replies. */
export function countRootComments(nodes: TaskCommentNode[]): number {
  return nodes.length;
}

/** Replies only, across all threads. */
export function countReplyComments(nodes: TaskCommentNode[]): number {
  return countComments(nodes) - countRootComments(nodes);
}

export function findCommentNode(
  nodes: TaskCommentNode[],
  id: string,
): TaskCommentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findCommentNode(node.replies, id);
    if (found) return found;
  }
  return null;
}

/** Root thread + most recent message in that thread (by created_at). */
export function getLatestThreadActivity(
  nodes: TaskCommentNode[],
): { root: TaskCommentNode; latest: TaskCommentNode } | null {
  let best: { root: TaskCommentNode; latest: TaskCommentNode; at: number } | null = null;

  function visit(node: TaskCommentNode, root: TaskCommentNode) {
    const at = new Date(node.created_at).getTime();
    if (!best || at > best.at) {
      best = { root, latest: node, at };
    }
    for (const reply of node.replies) visit(reply, root);
  }

  for (const root of nodes) visit(root, root);
  return best ? { root: best.root, latest: best.latest } : null;
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
  const mentions = extractMentionIds(getCommentDisplayText(body), members);

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
  const mentions = extractMentionIds(getCommentDisplayText(body), members);

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

async function collectCommentSubtreeIds(rootId: string): Promise<string[]> {
  const ids: string[] = [rootId];

  const { data, error } = await supabase
    .from("task_comments")
    .select("id")
    .eq("parent_id", rootId);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    ids.push(...(await collectCommentSubtreeIds(row.id)));
  }

  return ids;
}

export async function deleteTaskComment(commentId: string, orgId: string): Promise<void> {
  const subtreeIds = await collectCommentSubtreeIds(commentId);

  const { data: commentRows, error: fetchError } = await supabase
    .from("task_comments")
    .select("body")
    .in("id", subtreeIds);

  if (fetchError) throw new Error(fetchError.message);

  const attachmentIds = extractAttachmentIdsFromBodies(
    (commentRows ?? []).map((row) => row.body),
  );

  if (attachmentIds.length > 0) {
    await deleteTaskAttachmentsByIds(orgId, attachmentIds);
  }

  const { error } = await supabase.from("task_comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
}
