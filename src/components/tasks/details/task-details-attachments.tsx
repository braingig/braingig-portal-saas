import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { TaskDetailsSection } from "@/components/tasks/details/task-details-section";
import { FilePreview } from "@/components/ui/file-preview";
import { getAttachmentPublicUrl } from "@/lib/projects/attachments";
import { listTaskAttachments, type TaskAttachment } from "@/lib/tasks/attachments";
import { toast } from "sonner";

type TaskDetailsAttachmentsProps = {
  orgId: string;
  taskId: string;
  refreshKey?: number;
  bare?: boolean;
};

export function TaskDetailsAttachments({ orgId, taskId, refreshKey = 0, bare = false }: TaskDetailsAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTaskAttachments(orgId, taskId)
      .then(setAttachments)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load attachments"))
      .finally(() => setLoading(false));
  }, [orgId, taskId, refreshKey]);

  if (loading) {
    const content = <p className="text-sm text-muted-foreground">Loading attachments…</p>;
    if (bare) return content;
    return (
      <TaskDetailsSection title="Attachments" icon={Paperclip}>
        {content}
      </TaskDetailsSection>
    );
  }

  if (attachments.length === 0) {
    const content = <p className="text-sm text-muted-foreground">No files attached.</p>;
    if (bare) return content;
    return (
      <TaskDetailsSection title="Attachments" icon={Paperclip}>
        {content}
      </TaskDetailsSection>
    );
  }

  const grid = (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <FilePreview
          key={attachment.id}
          name={attachment.name}
          url={attachment.url || getAttachmentPublicUrl(attachment.storage_path)}
          mimeType={attachment.mime_type}
          sizeBytes={attachment.size_bytes || undefined}
        />
      ))}
    </div>
  );

  if (bare) return grid;

  return (
    <TaskDetailsSection title="Attachments" icon={Paperclip} count={attachments.length}>
      {grid}
    </TaskDetailsSection>
  );
}
