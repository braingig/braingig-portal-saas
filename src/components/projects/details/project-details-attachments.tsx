import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { CollapsibleDetailCard } from "@/components/projects/details/collapsible-detail-card";
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

  const grid = attachments.length === 0 ? (
    <p className="text-sm text-muted-foreground">No files attached to this project.</p>
  ) : (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <FilePreview
          key={attachment.id}
          name={attachment.name}
          url={attachment.url}
          downloadUrl={attachment.downloadUrl}
          mimeType={attachment.mime_type}
          sizeBytes={attachment.size_bytes || undefined}
        />
      ))}
    </div>
  );

  if (attachments.length === 0) {
    return (
      <CollapsibleDetailCard
        title="Attachments"
        icon={Paperclip}
        hint="View attachments"
        defaultOpen={false}
      >
        {grid}
      </CollapsibleDetailCard>
    );
  }

  return (
    <CollapsibleDetailCard
      title="Attachments"
      icon={Paperclip}
      count={attachments.length}
      hint={`View ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`}
      defaultOpen={attachments.length <= 2}
    >
      {grid}
    </CollapsibleDetailCard>
  );
}
