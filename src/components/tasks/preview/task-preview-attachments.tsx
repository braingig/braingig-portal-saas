import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { FilePreview } from "@/components/ui/file-preview";
import { getAttachmentPublicUrl } from "@/lib/projects/attachments";
import {
  listTaskAttachments,
  uploadTaskFiles,
  type TaskAttachment,
} from "@/lib/tasks/attachments";
import { previewMeta } from "@/components/tasks/preview/task-preview-styles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskPreviewAttachmentsProps = {
  orgId: string;
  userId: string;
  taskId: string;
  refreshKey?: number;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  onUploaded?: () => void;
};

export function TaskPreviewAttachments({
  orgId,
  userId,
  taskId,
  refreshKey = 0,
  fileInputRef: externalInputRef,
  onUploaded,
}: TaskPreviewAttachmentsProps) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [taskId]);

  useEffect(() => {
    let cancelled = false;
    const showSpinner = !hasLoadedRef.current;
    if (showSpinner) setLoading(true);

    listTaskAttachments(orgId, taskId)
      .then((rows) => {
        if (!cancelled) setAttachments(rows);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load attachments"))
      .finally(() => {
        if (!cancelled) {
          hasLoadedRef.current = true;
          if (showSpinner) setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, taskId, refreshKey]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length || uploading) return;
    setUploading(true);
    try {
      const uploaded = await uploadTaskFiles(orgId, userId, taskId, Array.from(files));
      if (!uploaded.length) {
        toast.error("No files were uploaded");
        return;
      }
      toast.success(uploaded.length === 1 ? "File attached" : `${uploaded.length} files attached`);
      onUploaded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void handleUpload(e.target.files)}
      />

      {loading ? (
        <p className={previewMeta}>Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/60 bg-surface/30 px-3 py-3 text-left transition-colors hover:border-border hover:bg-surface/50 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className={previewMeta}>No files yet — click to upload</span>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {attachments.map((attachment) => (
              <FilePreview
                key={attachment.id}
                name={attachment.name}
                url={attachment.url || getAttachmentPublicUrl(attachment.storage_path)}
                mimeType={attachment.mime_type}
                sizeBytes={attachment.size_bytes || undefined}
                size="dense"
              />
            ))}
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
              previewMeta,
              uploading && "opacity-50",
            )}
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
            Add more files
          </button>
        </>
      )}
    </div>
  );
}
