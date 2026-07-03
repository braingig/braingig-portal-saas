import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { FileUpload } from "@/components/ui/file-upload";
import { FilePreview } from "@/components/ui/file-preview";
import {
  deleteProjectAttachment,
  listProjectAttachments,
  type ProjectAttachment,
} from "@/lib/projects/attachments";
import { toast } from "sonner";

type ProjectAttachmentsFieldProps = {
  idPrefix: string;
  orgId: string;
  projectId?: string;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
};

export function ProjectAttachmentsField({
  idPrefix,
  orgId,
  projectId,
  newFiles,
  onNewFilesChange,
}: ProjectAttachmentsFieldProps) {
  const [existing, setExisting] = useState<ProjectAttachment[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!projectId || !orgId) {
      setExisting([]);
      return;
    }

    setLoadingExisting(true);
    listProjectAttachments(orgId, projectId)
      .then(setExisting)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load attachments"))
      .finally(() => setLoadingExisting(false));
  }, [orgId, projectId]);

  async function removeExisting(attachment: ProjectAttachment) {
    try {
      await deleteProjectAttachment(attachment);
      setExisting((prev) => prev.filter((a) => a.id !== attachment.id));
      toast.success("Attachment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove attachment");
    }
  }

  return (
    <FormField label="Attachments" htmlFor={`${idPrefix}-attachment`}>
      {loadingExisting && (
        <p className="mb-2 text-xs text-muted-foreground">Loading existing files…</p>
      )}

      {existing.length > 0 && (
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          {existing.map((attachment) => (
            <FilePreview
              key={attachment.id}
              name={attachment.name}
              url={attachment.url}
              downloadUrl={attachment.downloadUrl}
              mimeType={attachment.mime_type}
              sizeBytes={attachment.size_bytes}
              onRemove={() => removeExisting(attachment)}
              compact
            />
          ))}
        </div>
      )}

      <FileUpload
        id={`${idPrefix}-attachment`}
        files={newFiles}
        onFilesChange={onNewFilesChange}
        multiple
      />
    </FormField>
  );
}
