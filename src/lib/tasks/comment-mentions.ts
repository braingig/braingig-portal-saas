import type { TaskOrgMember } from "@/lib/tasks/types";

export type MentionQuery = {
  query: string;
  start: number;
};

/** Active @-mention query at the caret, if any. */
export function getMentionQuery(text: string, caretPos: number): MentionQuery | null {
  const before = text.slice(0, caretPos);
  const match = before.match(/@([^\n@]*)$/);
  if (!match) return null;
  return { query: match[1], start: caretPos - match[0].length };
}

export function insertMention(
  text: string,
  start: number,
  caretPos: number,
  name: string,
): { text: string; caret: number } {
  const mention = `@${name} `;
  const nextText = text.slice(0, start) + mention + text.slice(caretPos);
  return { text: nextText, caret: start + mention.length };
}

export function filterMentionMembers(members: TaskOrgMember[], query: string): TaskOrgMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return members.slice(0, 8);
  return members
    .filter((m) => m.full_name.toLowerCase().includes(q))
    .slice(0, 8);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve @Name tokens in plain text to user IDs. */
export function extractMentionIds(body: string, members: TaskOrgMember[]): string[] {
  const ids = new Set<string>();
  const sorted = [...members].sort((a, b) => b.full_name.length - a.full_name.length);

  for (const member of sorted) {
    const pattern = new RegExp(`@${escapeRegExp(member.full_name)}(?=[\\s,.!?;:]|$)`, "g");
    if (pattern.test(body)) ids.add(member.id);
  }

  return [...ids];
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Extract mention IDs from rich text (data-mention-id spans + plain @Name tokens). */
export function extractMentionIdsFromHtml(html: string, members: TaskOrgMember[] = []): string[] {
  const ids = new Set<string>();

  for (const match of html.matchAll(/data-mention-id="([^"]+)"/g)) {
    ids.add(match[1]);
  }

  extractMentionIds(stripHtmlTags(html), members).forEach((id) => ids.add(id));
  return [...ids];
}

export type CommentBodyPart =
  | { type: "text"; value: string }
  | { type: "mention"; name: string; userId: string };

/** Split comment body into plain text and mention segments for rendering. */
export function parseCommentBody(body: string, members: TaskOrgMember[]): CommentBodyPart[] {
  if (!body) return [];

  const sorted = [...members].sort((a, b) => b.full_name.length - a.full_name.length);
  const parts: CommentBodyPart[] = [];
  let cursor = 0;

  while (cursor < body.length) {
    let matched: { name: string; userId: string; index: number } | null = null;

    for (const member of sorted) {
      const token = `@${member.full_name}`;
      if (body.startsWith(token, cursor)) {
        const nextChar = body[cursor + token.length];
        if (nextChar === undefined || /[\s,.!?;:]/.test(nextChar)) {
          matched = { name: member.full_name, userId: member.id, index: cursor };
          break;
        }
      }
    }

    if (!matched) {
      const nextAt = body.indexOf("@", cursor);
      const end = nextAt === -1 ? body.length : nextAt;
      if (end > cursor) parts.push({ type: "text", value: body.slice(cursor, end) });
      cursor = nextAt === -1 ? body.length : nextAt + 1;
      if (nextAt !== -1) parts.push({ type: "text", value: "@" });
      continue;
    }

    if (matched.index > cursor) {
      parts.push({ type: "text", value: body.slice(cursor, matched.index) });
    }

    parts.push({ type: "mention", name: matched.name, userId: matched.userId });
    cursor = matched.index + matched.name.length + 1;
  }

  return parts;
}
