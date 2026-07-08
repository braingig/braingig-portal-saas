import { useLayoutEffect, useRef, useState } from "react";
import { stripHtml } from "@/lib/format";
import { projectBody, projectMuted } from "@/components/projects/details/project-details-styles";
import { cn } from "@/lib/utils";

const richTextClass = cn(
  projectBody,
  "[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2",
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
);

type ExpandableDetailTextProps = {
  html?: string | null;
  collapsedLines?: 2 | 3;
  emptyMessage?: string;
};

export function ExpandableDetailText({
  html,
  collapsedLines = 3,
  emptyMessage = "No content provided.",
}: ExpandableDetailTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const plain = stripHtml(html);
  const hasHtml = html && html !== plain;
  const empty = !plain && !hasHtml;

  useLayoutEffect(() => {
    if (expanded || empty) {
      setCanExpand(false);
      return;
    }
    const el = contentRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > el.clientHeight + 1);
  }, [html, expanded, empty, collapsedLines]);

  if (empty) {
    return <p className={projectMuted}>{emptyMessage}</p>;
  }

  return (
    <div>
      <div
        ref={contentRef}
        className={cn(
          richTextClass,
          !expanded && collapsedLines === 2 && "line-clamp-2",
          !expanded && collapsedLines === 3 && "line-clamp-3",
        )}
      >
        {hasHtml ? (
          <div dangerouslySetInnerHTML={{ __html: html! }} />
        ) : (
          <p>{plain}</p>
        )}
      </div>
      {(canExpand || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
