import { FileText, StickyNote } from "lucide-react";
import { useEffect, useRef } from "react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { RichTextEditor, isRichTextEmpty } from "@/components/ui/rich-text-editor";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskDetailsDescriptionProps = {
  description: string | null;
  note?: string | null;
  members: TaskOrgMember[];
  onDescriptionChange: (value: string) => void | Promise<void>;
  onNoteChange?: (value: string) => void | Promise<void>;
  bare?: boolean;
  descriptionOnly?: boolean;
  noteOnly?: boolean;
};

export function TaskDetailsDescription({
  description,
  note,
  members,
  onDescriptionChange,
  onNoteChange,
  bare = false,
  descriptionOnly = false,
  noteOnly = false,
}: TaskDetailsDescriptionProps) {
  const descriptionTimer = useRef<ReturnType<typeof setTimeout>>();
  const noteTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingDescription = useRef(description || "");
  const pendingNote = useRef(note || "");

  useEffect(() => {
    pendingDescription.current = description || "";
    pendingNote.current = note || "";
  }, [description, note]);

  useEffect(() => () => {
    if (descriptionTimer.current) {
      clearTimeout(descriptionTimer.current);
      void onDescriptionChange(pendingDescription.current);
    }
    if (noteTimer.current && onNoteChange) {
      clearTimeout(noteTimer.current);
      void onNoteChange(pendingNote.current);
    }
  }, [onDescriptionChange, onNoteChange]);

  function debouncedDescription(value: string) {
    pendingDescription.current = value;
    clearTimeout(descriptionTimer.current);
    descriptionTimer.current = setTimeout(() => onDescriptionChange(value), 600);
  }

  function debouncedNote(value: string) {
    if (!onNoteChange) return;
    pendingNote.current = value;
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => onNoteChange(value), 600);
  }

  const descriptionEditor = (
    <>
      <RichTextEditor
        value={description || ""}
        onChange={debouncedDescription}
        members={members}
        placeholder="Add a detailed description… Type @ to mention someone."
        minHeight="140px"
      />
      {isRichTextEmpty(description || "") && (
        <p className="mt-2 text-xs text-muted-foreground">
          Use @ to mention teammates — they will be notified.
        </p>
      )}
    </>
  );

  const noteEditor = (
    <RichTextEditor
      value={note || ""}
      onChange={debouncedNote}
      members={members}
      placeholder="Internal notes (optional)… Type @ to mention someone."
      minHeight="100px"
    />
  );

  if (bare) {
    if (noteOnly && onNoteChange) return <>{noteEditor}</>;
    return (
      <div className="space-y-5">
        {!noteOnly && descriptionEditor}
        {!descriptionOnly && onNoteChange && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Internal note</p>
            {noteEditor}
          </div>
        )}
      </div>
    );
  }

  if (noteOnly && onNoteChange) {
    return (
      <TaskDetailsSection title="Internal note" icon={StickyNote}>
        {noteEditor}
      </TaskDetailsSection>
    );
  }

  if (descriptionOnly) {
    return (
      <TaskDetailsSection title="Description" icon={FileText}>
        {descriptionEditor}
      </TaskDetailsSection>
    );
  }

  return (
    <div className="space-y-4">
      <TaskDetailsSection title="Description" icon={FileText}>
        {descriptionEditor}
      </TaskDetailsSection>

      {onNoteChange && (
        <TaskDetailsSection title="Note" icon={StickyNote}>
          {noteEditor}
        </TaskDetailsSection>
      )}
    </div>
  );
}
