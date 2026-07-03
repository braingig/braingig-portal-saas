import { parseCommentBody } from "@/lib/tasks/comment-mentions";
import type { TaskOrgMember } from "@/lib/tasks/types";

type CommentBodyProps = {
  body: string;
  members: TaskOrgMember[];
};

export function CommentBody({ body, members }: CommentBodyProps) {
  const parts = parseCommentBody(body, members);

  if (parts.length === 0) return null;

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
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
  );
}
