import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  isRichTextEmpty,
  RichTextContent,
  RichTextEditor,
} from "@/components/ui/rich-text-editor";
import { previewFieldBlock } from "@/components/tasks/preview/task-preview-styles";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewExpandableRichTextProps = {
  label: string;
  html: string | null;
  members: TaskOrgMember[];
  compact?: boolean;
  collapsedMaxHeight?: number;
  placeholder?: string;
  emptyActionLabel?: string;
  onSave: (value: string, previous: string) => void | Promise<void>;
};

const DEFAULT_COLLAPSED = 64;

export function TaskPreviewExpandableRichText({
  label,
  html: htmlProp,
  members,
  compact = false,
  collapsedMaxHeight = DEFAULT_COLLAPSED,
  placeholder = "Add content…",
  emptyActionLabel,
  onSave,
}: TaskPreviewExpandableRichTextProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [draft, setDraft] = useState(htmlProp ?? "");
  const savedBaseline = useRef(htmlProp ?? "");
  const pending = useRef(htmlProp ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onSaveRef = useRef(onSave);
  const editingRef = useRef(editing);
  const contentRef = useRef<HTMLDivElement>(null);

  onSaveRef.current = onSave;
  editingRef.current = editing;

  const html = htmlProp ?? "";
  const empty = isRichTextEmpty(html);
  const actionLabel = emptyActionLabel ?? `Add ${label.toLowerCase()}…`;

  useEffect(() => {
    if (!editingRef.current) {
      const next = htmlProp ?? "";
      savedBaseline.current = next;
      pending.current = next;
      setDraft(next);
      setExpanded(false);
    }
  }, [htmlProp]);

  useLayoutEffect(() => {
    if (editing || empty) {
      setCanExpand(false);
      return;
    }
    if (expanded) {
      setCanExpand(true);
      return;
    }
    const el = contentRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > collapsedMaxHeight + 1);
  }, [html, editing, expanded, empty, collapsedMaxHeight]);

  useEffect(() => () => {
    clearTimeout(timer.current);
    const value = pending.current;
    const previous = savedBaseline.current;
    if (value !== previous) {
      void onSaveRef.current(value, previous);
    }
  }, []);

  async function flushSave() {
    clearTimeout(timer.current);
    const value = pending.current;
    const previous = savedBaseline.current;
    if (value === previous) return;
    await onSaveRef.current(value, previous);
    savedBaseline.current = value;
  }

  function scheduleSave(value: string) {
    setDraft(value);
    pending.current = value;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushSave(), 600);
  }

  function startEditing() {
    const initial = htmlProp ?? "";
    savedBaseline.current = initial;
    pending.current = initial;
    setDraft(initial);
    setEditing(true);
  }

  function finishEditing() {
    void flushSave();
    setEditing(false);
  }

  const labelClass = compact
    ? "text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
    : "text-xs font-medium text-muted-foreground";

  if (compact && empty && !editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={cn(
          "rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/70 transition-colors",
          "hover:bg-surface/60 hover:text-brand",
        )}
      >
        {actionLabel}
      </button>
    );
  }

  if (editing) {
    return (
      <section className={cn(previewFieldBlock, "bg-surface/30")}>
        <div className="mb-2 flex items-center justify-between">
          <span className={labelClass}>{label}</span>
          <button
            type="button"
            onClick={finishEditing}
            className="rounded-md px-2 py-0.5 text-[11px] font-medium text-brand transition-colors hover:bg-surface/60"
          >
            Done
          </button>
        </div>
        <RichTextEditor
          value={draft}
          onChange={scheduleSave}
          members={members}
          placeholder={placeholder}
          minHeight={compact ? "72px" : "100px"}
        />
      </section>
    );
  }

  return (
    <section className={cn(previewFieldBlock, !empty && "cursor-default")}>
      <span className={labelClass}>{label}</span>
      {empty ? (
        <button
          type="button"
          onClick={startEditing}
          className={cn(
            "mt-1.5 rounded-md px-1 py-0.5 text-left transition-colors",
            compact ? "text-[12px] text-muted-foreground/70" : "text-[13px] text-muted-foreground/70",
            "hover:bg-surface/60 hover:text-brand",
          )}
        >
          {actionLabel}
        </button>
      ) : (
        <>
          <div
            ref={contentRef}
            className={cn(
              "mt-1.5 text-muted-foreground",
              compact ? "text-[12px] leading-relaxed" : "text-[13px] leading-relaxed",
              !expanded && "overflow-hidden",
            )}
            style={!expanded ? { maxHeight: collapsedMaxHeight } : undefined}
          >
            <RichTextContent html={html} />
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {(canExpand || expanded) && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-brand transition-colors hover:bg-surface/60"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
            <button
              type="button"
              onClick={startEditing}
              className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-brand transition-colors hover:bg-surface/60"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </section>
  );
}
