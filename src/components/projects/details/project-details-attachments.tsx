import { useEffect, useState } from "react";
import { DetailCard } from "@/components/projects/details/detail-card";
import { FilePreview } from "@/components/ui/file-preview";
import {
  listProjectAttachments,
  type ProjectAttachment,
} from "@/lib/projects/attachments";
import type { ProjectRecord } from "@/lib/projects/types";
import { toast } from "sonner";

type ProjectDetailsAttachmentsProps = {
  project: ProjectRecord;
  orgId: string;
};

export function ProjectDetailsAttachments({ project, orgId }: ProjectDetailsAttachmentsProps) {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjectAttachments(orgId, project.id)
      .then((rows) => {
        if (rows.length > 0) {
          setAttachments(rows);
          return;
        }
        if (project.attachment_url) {
          setAttachments([{
            id: "legacy",
            name: "Attached file",
            storage_path: "",
            size_bytes: 0,
            mime_type: null,
            url: project.attachment_url,
            downloadUrl: project.attachment_url,
          }]);
        } else {
          setAttachments([]);
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load attachments"))
      .finally(() => setLoading(false));
  }, [orgId, project.id, project.attachment_url]);

  if (loading) {
    return (
      <DetailCard title="Attachments">
        <p className="text-sm text-muted-foreground">Loading attachments…</p>
      </DetailCard>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <DetailCard title="Attachments">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {attachments.map((attachment) => (
          <FilePreview
            key={attachment.id}
            name={attachment.name}
            url={attachment.url}
            downloadUrl={attachment.downloadUrl}
            mimeType={attachment.mime_type}
            sizeBytes={attachment.size_bytes || undefined}
            size="dense"
          />
        ))}
      </div>
    </DetailCard>
  );
}
