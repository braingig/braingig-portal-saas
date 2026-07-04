import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  isRichTextEmpty,
  RichTextContent,
  RichTextEditor,
} from "@/components/ui/rich-text-editor";
import { previewFieldBlock } from "@/components/tasks/preview/task-preview-styles";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewNoteProps = {
  note: string | null;
  members: TaskOrgMember[];
  onSave: (value: string, previous: string) => void | Promise<void>;
};

const COLLAPSED_MAX_HEIGHT = 96;

export function TaskPreviewNote({
  note,
  members,
  onSave,
}: TaskPreviewNoteProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const savedBaseline = useRef(note ?? "");
  const pending = useRef(note ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onSaveRef = useRef(onSave);
  const editingRef = useRef(editing);
  const contentRef = useRef<HTMLDivElement>(null);

  onSaveRef.current = onSave;
  editingRef.current = editing;

  const html = note ?? "";
  const empty = isRichTextEmpty(html);

  useEffect(() => {
    if (!editingRef.current) {
      const next = note ?? "";
      savedBaseline.current = next;
      pending.current = next;
      setDraft(next);
      setExpanded(false);
    }
  }, [note]);

  useLayoutEffect(() => {
    if (editing || expanded || empty) {
      setCanExpand(false);
      return;
    }
    const el = contentRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 1);
  }, [html, editing, expanded, empty]);

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
    const initial = note ?? "";
    savedBaseline.current = initial;
    pending.current = initial;
    setDraft(initial);
    setEditing(true);
  }

  function finishEditing() {
    void flushSave();
    setEditing(false);
  }

  if (editing) {
    return (
      <section className={cn(previewFieldBlock, "bg-surface/30")}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Internal note</span>
          <button
            type="button"
            onClick={finishEditing}
            className="text-xs font-medium text-brand hover:text-brand/80"
          >
            Done
          </button>
        </div>
        <RichTextEditor
          value={draft}
          onChange={scheduleSave}
          members={members}
          placeholder="Internal notes (optional)… Type @ to mention someone."
          minHeight="100px"
        />
      </section>
    );
  }

  return (
    <section className={previewFieldBlock}>
      <span className="text-xs font-medium text-muted-foreground">Internal note</span>
      <div className="relative mt-1.5">
        {empty ? (
          <p className="text-sm leading-relaxed text-muted-foreground">No internal note yet.</p>
        ) : (
          <>
            <div
              ref={contentRef}
              className={cn(
                "overflow-hidden",
                !expanded && "max-h-24",
              )}
            >
              <RichTextContent html={html} />
            </div>
            {!expanded && canExpand && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
              />
            )}
          </>
        )}
      </div>
      {!empty && canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 text-xs font-medium text-brand hover:text-brand/80"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
      <button
        type="button"
        onClick={startEditing}
        className="mt-2 text-xs font-medium text-brand hover:text-brand/80"
      >
        {empty ? "Add note" : "Edit"}
      </button>
    </section>
  );
}
