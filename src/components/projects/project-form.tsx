import { Paperclip } from "lucide-react";
import { ProjectAttachmentsField } from "@/components/projects/project-attachments-field";
import { ProjectFormMeta } from "@/components/projects/project-form-meta";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  previewFieldBlock,
  previewModalTitle,
  previewTitleField,
} from "@/components/tasks/preview/task-preview-styles";
import type { ProjectFormValues } from "@/lib/projects/constants";
import { cn } from "@/lib/utils";

type ProjectFormProps = {
  values: ProjectFormValues;
  onChange: (values: ProjectFormValues) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  orgId: string;
  projectId?: string;
  idPrefix?: string;
};

export function ProjectForm({
  values,
  onChange,
  newFiles,
  onNewFilesChange,
  orgId,
  projectId,
  idPrefix = "project",
}: ProjectFormProps) {
  return (
    <div className="space-y-6">
      <div className={cn(previewTitleField, "-mx-2.5")}>
        <input
          id={`${idPrefix}-name`}
          required
          placeholder="Project name"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          className={cn(
            "w-full border-0 bg-transparent outline-none placeholder:text-muted-foreground/45",
            previewModalTitle,
          )}
        />
      </div>

      <ProjectFormMeta values={values} onChange={onChange} />

      <section className={previewFieldBlock}>
        <span className="text-xs font-medium text-muted-foreground">
          Description<span className="ml-0.5 text-danger">*</span>
        </span>
        <div className="mt-2">
          <RichTextEditor
            value={values.description}
            onChange={(description) => onChange({ ...values, description })}
            placeholder="Describe scope, goals, and deliverables…"
            minHeight="100px"
          />
        </div>
      </section>

      <section className={previewFieldBlock}>
        <span className="text-xs font-medium text-muted-foreground">Internal note</span>
        <div className="mt-2">
          <RichTextEditor
            value={values.note}
            onChange={(note) => onChange({ ...values, note })}
            placeholder="Team-only notes (optional)…"
            minHeight="90px"
          />
        </div>
      </section>

      <section className={previewFieldBlock}>
        <div className="mb-2 flex items-center gap-2">
          <Paperclip className="size-3.5 text-muted-foreground/70" strokeWidth={1.75} />
          <span className="text-xs font-medium text-muted-foreground">Attachments</span>
        </div>
        <ProjectAttachmentsField
          idPrefix={idPrefix}
          orgId={orgId}
          projectId={projectId}
          newFiles={newFiles}
          onNewFilesChange={onNewFilesChange}
          bare
        />
      </section>
    </div>
  );
}
