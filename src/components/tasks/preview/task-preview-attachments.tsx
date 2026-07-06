import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Plus } from "lucide-react";
import { getAttachmentPublicUrl } from "@/lib/projects/attachments";
import {
  listTaskAttachments,
  uploadTaskFiles,
  type TaskAttachment,
} from "@/lib/tasks/attachments";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TaskPreviewAttachmentsProps = {
  orgId: string;
  userId: string;
  taskId: string;
  refreshKey?: number;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  compact?: boolean;
  onUploaded?: () => void;
};

export function TaskPreviewAttachments({
  orgId,
  userId,
  taskId,
  refreshKey = 0,
  fileInputRef: externalInputRef,
  compact = false,
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

  function downloadAll() {
    attachments.forEach((attachment) => {
      const url = attachment.url || getAttachmentPublicUrl(attachment.storage_path);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void handleUpload(e.target.files)}
      />

      <div className={cn("mb-3 flex items-center justify-between", compact && "mb-2")}>
        <h3 className={cn("font-medium text-foreground", compact ? "text-[11px] uppercase tracking-wide text-muted-foreground" : "text-[13px]")}>
          {compact ? "Files" : (
            <>
              Attachment{attachments.length !== 1 ? "s" : ""}
              {attachments.length > 0 && (
                <span className="ml-1 text-muted-foreground">({attachments.length})</span>
              )}
            </>
          )}
          {compact && attachments.length > 0 && (
            <span className="ml-1 normal-case text-muted-foreground">({attachments.length})</span>
          )}
        </h3>
        {attachments.length > 0 && !compact && (
          <button
            type="button"
            onClick={downloadAll}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand/80"
          >
            <Download className="size-3.5" />
            Download All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-[13px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading attachments…
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
          {attachments.map((attachment) => {
            const url = attachment.url || getAttachmentPublicUrl(attachment.storage_path);
            return (
              <a
                key={attachment.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={attachment.name}
                className={cn(
                  "inline-flex max-w-[8.5rem] items-center gap-1.5 rounded-md border border-border/60 bg-surface/30 px-2 py-1 transition-colors",
                  "hover:border-border hover:bg-surface/60",
                )}
              >
                <FileText className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate text-[11px] text-foreground">{attachment.name}</span>
              </a>
            );
          })}

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground transition-colors hover:border-border hover:bg-surface/50 hover:text-foreground disabled:opacity-50"
            aria-label="Add attachment"
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
