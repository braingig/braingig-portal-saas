import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  isRichTextEmpty,
  RichTextContent,
  RichTextEditor,
} from "@/components/ui/rich-text-editor";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPreviewDescriptionProps = {
  description: string | null;
  members: TaskOrgMember[];
  onSave: (value: string, previous: string) => void | Promise<void>;
};

const COLLAPSED_MAX_HEIGHT = 96;

export function TaskPreviewDescription({
  description,
  members,
  onSave,
}: TaskPreviewDescriptionProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [draft, setDraft] = useState(description ?? "");
  const savedBaseline = useRef(description ?? "");
  const pending = useRef(description ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onSaveRef = useRef(onSave);
  const editingRef = useRef(editing);
  const contentRef = useRef<HTMLDivElement>(null);

  onSaveRef.current = onSave;
  editingRef.current = editing;

  const html = description ?? "";
  const empty = isRichTextEmpty(html);

  useEffect(() => {
    if (!editingRef.current) {
      const next = description ?? "";
      savedBaseline.current = next;
      pending.current = next;
      setDraft(next);
      setExpanded(false);
    }
  }, [description]);

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
    const initial = description ?? "";
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
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
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
          placeholder="What needs to be done?"
          minHeight="100px"
        />
      </section>
    );
  }

  return (
    <section>
      <span className="text-xs font-medium text-muted-foreground">Description</span>
      <div className="relative mt-1.5">
        {empty ? (
          <p className="text-sm leading-relaxed text-muted-foreground">No description yet.</p>
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
        {empty ? "Add description" : "Edit"}
      </button>
    </section>
  );
}
