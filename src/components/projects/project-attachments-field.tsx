import { useEffect, useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { FilePreview } from "@/components/ui/file-preview";
import {
  deleteProjectAttachment,
  listProjectAttachments,
  type ProjectAttachment,
} from "@/lib/projects/attachments";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProjectAttachmentsFieldProps = {
  idPrefix: string;
  orgId: string;
  projectId?: string;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  bare?: boolean;
};

export function ProjectAttachmentsField({
  idPrefix,
  orgId,
  projectId,
  newFiles,
  onNewFilesChange,
  bare = false,
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

  const body = (
    <>
      {loadingExisting && (
        <p className="mb-2 text-xs text-muted-foreground">Loading files…</p>
      )}

      {existing.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {existing.map((attachment) => (
            <FilePreview
              key={attachment.id}
              name={attachment.name}
              url={attachment.url}
              downloadUrl={attachment.downloadUrl}
              mimeType={attachment.mime_type}
              sizeBytes={attachment.size_bytes}
              onRemove={() => removeExisting(attachment)}
              size="dense"
            />
          ))}
        </div>
      )}

      <FileUpload
        id={`${idPrefix}-attachment`}
        files={newFiles}
        onFilesChange={onNewFilesChange}
        multiple
        className="[&_label]:min-h-[56px] [&_label]:rounded-lg [&_label]:border-border/50 [&_label]:bg-surface/30 [&_label]:px-3 [&_label]:py-2.5 [&_label]:hover:border-border/70 [&_label]:hover:bg-surface/50 [&_p]:text-xs"
      />
    </>
  );

  if (bare) {
    return <div>{body}</div>;
  }

  return (
    <div className={cn("space-y-3")}>
      <p className="text-xs font-medium text-muted-foreground">Attachments</p>
      {body}
    </div>
  );
}
