import { FileText } from "lucide-react";
import { parseCommentBody } from "@/lib/tasks/comment-mentions";
import { parseCommentAttachments } from "@/lib/tasks/comment-attachments";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type CommentBodyProps = {
  body: string;
  members: TaskOrgMember[];
  compact?: boolean;
};

export function CommentBody({ body, members, compact = false }: CommentBodyProps) {
  const { text, attachments } = parseCommentAttachments(body);
  const parts = parseCommentBody(text, members);

  if (parts.length === 0 && attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      {parts.length > 0 && (
        <p className={cn(
          "whitespace-pre-wrap break-words leading-relaxed text-foreground",
          compact ? "text-[13px]" : "text-sm",
        )}>
          {parts.map((part, index) => {
            if (part.type === "text") {
              return <span key={index}>{part.value}</span>;
            }
            return (
              <span
                key={index}
                className="rounded bg-brand/10 px-1 font-medium text-brand"
              >
                @{part.name}
              </span>
            );
          })}
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                title={attachment.name}
                className={cn(
                  "inline-flex max-w-[12rem] items-center gap-1.5 rounded-md border border-border/60 bg-surface/30 px-2 py-1 transition-colors",
                  "hover:border-border hover:bg-surface/60",
                )}
              >
                <FileText className="size-3 shrink-0 text-muted-foreground" />
                <span className={cn("truncate text-foreground", compact ? "text-[11px]" : "text-xs")}>
                  {attachment.name}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
