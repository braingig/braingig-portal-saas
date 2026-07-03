import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, AtSign, Send } from "lucide-react";
import { MentionSuggestionsPopover } from "@/components/tasks/mention-suggestions-popover";
import {
  filterMentionMembers,
  getMentionQuery,
  insertMention,
} from "@/lib/tasks/comment-mentions";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type CommentComposerProps = {
  members: TaskOrgMember[];
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  className?: string;
  layout?: "side-submit" | "card";
};

export function CommentComposer({
  members,
  onSubmit,
  placeholder = "Add a comment… Type @ to mention someone.",
  autoFocus = false,
  compact = false,
  submitLabel = "Send",
  onCancel,
  className,
  layout = "side-submit",
}: CommentComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = mentionStart !== null
    ? filterMentionMembers(members, mentionQuery)
    : [];

  const syncMentionState = useCallback((value: string, caret: number) => {
    const active = getMentionQuery(value, caret);
    if (!active) {
      setMentionStart(null);
      setMentionQuery("");
      setActiveIndex(0);
      return;
    }
    setMentionStart(active.start);
    setMentionQuery(active.query);
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function handleChange(value: string) {
    setText(value);
    const caret = textareaRef.current?.selectionStart ?? value.length;
    syncMentionState(value, caret);
  }

  function applyMention(member: TaskOrgMember) {
    if (mentionStart === null || !textareaRef.current) return;
    const caret = textareaRef.current.selectionStart;
    const result = insertMention(text, mentionStart, caret, member.full_name);
    setText(result.text);
    setMentionStart(null);
    setMentionQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(result.caret, result.caret);
    });
  }

  function insertMentionTrigger() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${text.slice(0, start)}@${text.slice(end)}`;
    setText(next);
    const caret = start + 1;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
      syncMentionState(next, caret);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
      setMentionStart(null);
      setMentionQuery("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionStart === null || suggestions.length === 0) {
      if (layout === "card" && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        textareaRef.current?.form?.requestSubmit();
        return;
      }
      if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      applyMention(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionStart(null);
      setMentionQuery("");
    }
  }

  if (layout === "card") {
    return (
      <form onSubmit={handleSubmit} className={cn("relative", className)}>
        <div className="rounded-xl border border-border/60 bg-card shadow-sm transition-shadow focus-within:border-brand/30 focus-within:ring-1 focus-within:ring-brand/10">
          <div ref={anchorRef} className="relative">
            <MentionSuggestionsPopover
              open={mentionStart !== null}
              anchorRef={anchorRef}
              members={members}
              query={mentionQuery}
              activeIndex={activeIndex}
              onSelect={applyMention}
            />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => syncMentionState(text, e.currentTarget.selectionStart)}
              onKeyUp={(e) => syncMentionState(text, e.currentTarget.selectionStart)}
              placeholder={placeholder}
              rows={compact ? 2 : 3}
              className={cn(
                "w-full resize-none rounded-t-xl bg-transparent outline-none placeholder:text-muted-foreground/70",
                compact
                  ? "min-h-[48px] px-2.5 pt-2 text-[12px] leading-snug"
                  : "min-h-[64px] px-3 pt-2.5 text-sm",
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-2 px-1.5 pb-1.5">
            <button
              type="button"
              onClick={insertMentionTrigger}
              className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Mention someone"
            >
              <AtSign className="size-3" />
            </button>
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="grid size-6 place-items-center rounded-full bg-brand text-brand-foreground transition-all hover:brightness-110 disabled:opacity-40"
              aria-label="Send comment"
            >
              <ArrowUp className="size-3" />
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative flex gap-2", className)}>
      <div ref={anchorRef} className="relative min-w-0 flex-1">
        <MentionSuggestionsPopover
          open={mentionStart !== null}
          anchorRef={anchorRef}
          members={members}
          query={mentionQuery}
          activeIndex={activeIndex}
          onSelect={applyMention}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => syncMentionState(text, e.currentTarget.selectionStart)}
          onKeyUp={(e) => syncMentionState(text, e.currentTarget.selectionStart)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className={cn(
            "w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-brand/30",
            compact ? "min-h-[64px]" : "min-h-[80px]",
          )}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2 self-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="inline-flex h-fit items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          <Send className="size-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
