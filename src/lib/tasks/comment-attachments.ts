export type CommentAttachment = {
  id: string;
  name: string;
  url: string;
};

const ATTACHMENT_MARKER = /\n\n<!-- bg-attachments:([\s\S]*?) -->$/;

export function parseCommentAttachments(body: string): {
  text: string;
  attachments: CommentAttachment[];
} {
  const match = body.match(ATTACHMENT_MARKER);
  if (!match) return { text: body, attachments: [] };

  try {
    const parsed = JSON.parse(match[1]) as CommentAttachment[];
    const attachments = Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && item?.name && item?.url)
      : [];
    return {
      text: body.slice(0, match.index ?? 0).trimEnd(),
      attachments,
    };
  } catch {
    return {
      text: body.replace(ATTACHMENT_MARKER, "").trimEnd(),
      attachments: [],
    };
  }
}

export function getCommentDisplayText(body: string) {
  return parseCommentAttachments(body).text;
}

export function extractAttachmentIdsFromBodies(bodies: string[]): string[] {
  const ids = new Set<string>();
  for (const body of bodies) {
    for (const attachment of parseCommentAttachments(body).attachments) {
      ids.add(attachment.id);
    }
  }
  return [...ids];
}

export function serializeCommentBody(text: string, attachments: CommentAttachment[]) {
  const trimmed = text.trim();
  if (!attachments.length) return trimmed;

  const payload = JSON.stringify(
    attachments.map(({ id, name, url }) => ({ id, name, url })),
  );

  return trimmed
    ? `${trimmed}\n\n<!-- bg-attachments:${payload} -->`
    : `<!-- bg-attachments:${payload} -->`;
}
