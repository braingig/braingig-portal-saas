import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { TaskFormMeta } from "@/components/tasks/task-form-meta";
import { previewFieldBlock, previewModalTitle } from "@/components/tasks/preview/task-preview-styles";
import type { TaskFormValues } from "@/lib/tasks/constants";
import type { TaskMilestone, TaskOrgMember, TaskProjectOption } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TaskFormProps = {
  values: TaskFormValues;
  onChange: (values: TaskFormValues) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  orgId: string;
  projects: TaskProjectOption[];
  members: TaskOrgMember[];
  mentionMembers?: TaskOrgMember[];
  isSubtask?: boolean;
  idPrefix?: string;
};

export function TaskForm({
  values,
  onChange,
  files,
  onFilesChange,
  orgId,
  projects,
  members,
  mentionMembers,
  isSubtask = false,
  idPrefix = "task",
}: TaskFormProps) {
  const mentions = mentionMembers ?? members;
  const [milestones, setMilestones] = useState<TaskMilestone[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    if (!values.projectId || !orgId) {
      setMilestones([]);
      return;
    }

    let cancelled = false;
    setLoadingFolders(true);

    void (async () => {
      const { data, error } = await supabase
        .from("milestones")
        .select("id, title, project_id")
        .eq("project_id", values.projectId)
        .order("position");

      if (cancelled) return;

      if (error) {
        console.warn("Failed to load folders:", error.message);
        setMilestones([]);
      } else {
        setMilestones(data ?? []);
      }
      setLoadingFolders(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [values.projectId, orgId]);

  return (
    <div className="space-y-6">
      <input
        id={`${idPrefix}-title`}
        required
        placeholder={isSubtask ? "Subtask name" : "Task name"}
        value={values.title}
        onChange={(e) => onChange({ ...values, title: e.target.value })}
        className={cn(
          "w-full border-0 bg-transparent outline-none placeholder:text-muted-foreground/45",
          previewModalTitle,
        )}
      />

      <TaskFormMeta
        values={values}
        onChange={onChange}
        members={members}
        projects={projects}
        milestones={milestones}
        loadingFolders={loadingFolders}
        isSubtask={isSubtask}
      />

      <section className={cn(previewFieldBlock, "bg-surface/30")}>
        <span className="text-xs font-medium text-muted-foreground">Description</span>
        <div className="mt-2">
          <RichTextEditor
            value={values.description}
            onChange={(description) => onChange({ ...values, description })}
            members={mentions}
            placeholder="What needs to be done? Type @ to mention someone."
            minHeight="100px"
          />
        </div>
      </section>

      <section className={cn(previewFieldBlock, "bg-surface/30")}>
        <span className="text-xs font-medium text-muted-foreground">Internal note</span>
        <div className="mt-2">
          <RichTextEditor
            value={values.note}
            onChange={(note) => onChange({ ...values, note })}
            members={mentions}
            placeholder="Internal notes (optional)… Type @ to mention someone."
            minHeight="90px"
          />
        </div>
      </section>

      <section className={previewFieldBlock}>
        <div className="mb-2 flex items-center gap-2">
          <Paperclip className="size-3.5 text-muted-foreground/70" strokeWidth={1.75} />
          <span className="text-xs font-medium text-muted-foreground">Attachments</span>
        </div>
        <FileUpload
          id={`${idPrefix}-files`}
          files={files}
          onFilesChange={onFilesChange}
          multiple
        />
      </section>


    </div>
  );
}
