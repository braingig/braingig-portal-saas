import { cn } from "@/lib/utils";

type HighlightedTextProps = {
  text: string;
  query: string;
  markClassName?: string;
};

/** Highlights the first case-insensitive match — same pattern as the tasks list search. */
export function HighlightedText({ text, query, markClassName }: HighlightedTextProps) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className={cn("rounded bg-brand/20 px-0.5 text-foreground", markClassName)}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
