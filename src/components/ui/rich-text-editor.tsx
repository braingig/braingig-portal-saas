import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";
import { MentionSuggestionsPopover } from "@/components/tasks/mention-suggestions-popover";
import {
  filterMentionMembers,
  getMentionQuery,
} from "@/lib/tasks/comment-mentions";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export const richTextContentClass =
  "[&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_u]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_.mention]:rounded [&_.mention]:bg-brand/10 [&_.mention]:px-0.5 [&_.mention]:font-medium [&_.mention]:text-brand";

const richTextProse = richTextContentClass;

function normalizeLinkUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPlainTextBeforeCaret(root: HTMLElement): { text: string; caret: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !root.contains(sel.anchorNode)) return null;
  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(range.endContainer, range.endOffset);
  const text = preRange.toString();
  return { text, caret: text.length };
}

function insertMentionInEditor(
  editor: HTMLElement,
  atOffset: number,
  caretOffset: number,
  name: string,
  userId: string,
) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.length;
    if (!startNode && charCount + len >= atOffset) {
      startNode = node;
      startOffset = atOffset - charCount;
    }
    if (charCount + len >= caretOffset) {
      endNode = node;
      endOffset = caretOffset - charCount;
      break;
    }
    charCount += len;
  }

  if (!startNode || !endNode) return;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  range.deleteContents();

  const span = document.createElement("span");
  span.className = "mention";
  span.dataset.mentionId = userId;
  span.textContent = `@${name}`;
  range.insertNode(span);

  const space = document.createTextNode("\u00a0");
  range.setStartAfter(span);
  range.collapse(true);
  range.insertNode(space);
  range.setStartAfter(space);
  range.collapse(true);

  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  members?: TaskOrgMember[];
};

type RichTextContentProps = {
  html: string;
  className?: string;
};

export function RichTextContent({ html, className }: RichTextContentProps) {
  return (
    <div
      className={cn("text-sm leading-relaxed text-foreground/90", richTextContentClass, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function isRichTextEmpty(html: string) {
  if (!html.trim()) return true;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return !tmp.textContent?.trim();
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here… Type @ to mention someone.",
  className,
  minHeight = "120px",
  members = [],
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const mentionStartRef = useRef<number | null>(null);
  const mentionCaretRef = useRef(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = mentionStart !== null && members.length > 0
    ? filterMentionMembers(members, mentionQuery)
    : [];

  useEffect(() => {
    const el = ref.current;
    if (!el || el.innerHTML === value) return;
    el.innerHTML = value;
  }, [value]);

  const sync = useCallback(() => {
    const html = ref.current?.innerHTML ?? "";
    onChange(html);
  }, [onChange]);

  const syncMentionState = useCallback(() => {
    const el = ref.current;
    if (!el || members.length === 0) {
      mentionStartRef.current = null;
      setMentionStart(null);
      setMentionQuery("");
      return;
    }
    const pos = getPlainTextBeforeCaret(el);
    if (!pos) {
      mentionStartRef.current = null;
      setMentionStart(null);
      setMentionQuery("");
      return;
    }
    const active = getMentionQuery(pos.text, pos.caret);
    if (!active) {
      mentionStartRef.current = null;
      setMentionStart(null);
      setMentionQuery("");
      setActiveIndex(0);
      return;
    }
    mentionStartRef.current = active.start;
    mentionCaretRef.current = pos.caret;
    setMentionStart(active.start);
    setMentionQuery(active.query);
    setActiveIndex(0);
  }, [members.length]);

  function exec(cmd: string) {
    document.execCommand(cmd, false);
    ref.current?.focus();
    sync();
  }

  function ensureLinkAttributes() {
    ref.current?.querySelectorAll("a").forEach((anchor) => {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    });
  }

  function insertLink() {
    const el = ref.current;
    if (!el) return;
    el.focus();

    const raw = window.prompt("Enter URL:", "https://");
    if (raw === null) return;

    const href = normalizeLinkUrl(raw);
    if (!href) {
      window.alert("Please enter a valid http or https URL.");
      return;
    }

    const selection = window.getSelection();
    const hasSelection =
      selection &&
      selection.rangeCount > 0 &&
      !selection.isCollapsed &&
      el.contains(selection.anchorNode);

    if (hasSelection) {
      document.execCommand("createLink", false, href);
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(href)}</a>`,
      );
    }

    ensureLinkAttributes();
    sync();
  }

  function dismissMention() {
    mentionStartRef.current = null;
    setMentionStart(null);
    setMentionQuery("");
    setActiveIndex(0);
  }

  function applyMention(member: TaskOrgMember) {
    const el = ref.current;
    const start = mentionStartRef.current;
    if (!el || start === null) return;
    const pos = getPlainTextBeforeCaret(el);
    const caret = pos?.caret ?? mentionCaretRef.current;
    insertMentionInEditor(el, start, caret, member.full_name, member.id);
    mentionStartRef.current = null;
    setMentionStart(null);
    setMentionQuery("");
    setActiveIndex(0);
    sync();
    requestAnimationFrame(() => el.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (mentionStart === null || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      applyMention(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionStart(null);
      setMentionQuery("");
    }
  }

  return (
    <div className={cn("relative rounded-lg border border-border bg-surface", className)}>
      <div className="flex items-center gap-0.5 border-b border-border bg-surface-2/50 px-2 py-1">
        {[
          { cmd: "bold", icon: Bold, label: "Bold" },
          { cmd: "italic", icon: Italic, label: "Italic" },
          { cmd: "underline", icon: Underline, label: "Underline" },
          { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
          { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
        ].map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
            className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Icon className="size-3.5" />
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          onMouseDown={(e) => {
            e.preventDefault();
            insertLink();
          }}
          className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Link2 className="size-3.5" />
        </button>
      </div>

      <div ref={anchorRef} className="relative">
        <MentionSuggestionsPopover
          open={mentionStart !== null}
          anchorRef={anchorRef}
          members={members}
          query={mentionQuery}
          activeIndex={activeIndex}
          onSelect={applyMention}
          onDismiss={dismissMention}
        />

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            sync();
            syncMentionState();
          }}
          onKeyUp={syncMentionState}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            const next = e.relatedTarget;
            if (next instanceof HTMLElement && next.closest("[data-mention-suggestions]")) return;
            sync();
          }}
          onClick={syncMentionState}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className={cn(
            "px-3 py-2.5 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
            richTextProse,
          )}
        />
      </div>
    </div>
  );
}
