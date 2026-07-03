import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { isImageAttachment, isPdfAttachment } from "@/lib/projects/attachments";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type FilePreviewSize = "default" | "compact" | "dense";

function resolveSize(compact: boolean | undefined, size?: FilePreviewSize): FilePreviewSize {
  if (size) return size;
  return compact ? "compact" : "default";
}

function previewHeight(size: FilePreviewSize) {
  if (size === "dense") return "h-20";
  if (size === "compact") return "h-28";
  return "h-40";
}

type FilePreviewProps = {
  name: string;
  url: string;
  downloadUrl?: string;
  mimeType?: string | null;
  sizeBytes?: number;
  onRemove?: () => void;
  /** @deprecated Prefer `size` */
  compact?: boolean;
  size?: FilePreviewSize;
  className?: string;
};

export function FilePreview({
  name,
  url,
  downloadUrl,
  mimeType,
  sizeBytes,
  onRemove,
  compact = false,
  size,
  className,
}: FilePreviewProps) {
  const resolvedSize = resolveSize(compact, size);
  const isImage = isImageAttachment(mimeType, name);
  const isPdf = isPdfAttachment(mimeType, name);
  const isDense = resolvedSize === "dense";
  const showPdfFrame = isPdf && !isDense;

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div className={cn("relative bg-surface-2", previewHeight(resolvedSize))}>
        {isImage ? (
          <img src={url} alt={name} className="size-full object-contain p-1.5" />
        ) : showPdfFrame ? (
          <iframe src={url} title={name} className="size-full border-0 bg-white" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <FileText className={cn(isDense ? "size-5" : "size-8")} />
            {!isDense && <span className="px-3 text-center text-xs">Preview not available</span>}
          </div>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md border border-border bg-background/90 text-muted-foreground shadow-sm hover:text-foreground"
            aria-label="Remove file"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-t border-border",
          isDense ? "px-2 py-1.5" : "px-3 py-2",
        )}
      >
        <div className="min-w-0">
          <p className={cn("truncate font-medium", isDense ? "text-[10px]" : "text-xs")}>{name}</p>
          {sizeBytes != null && !isDense && (
            <p className="text-[10px] text-muted-foreground">{formatFileSize(sizeBytes)}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="View file"
            className="text-muted-foreground hover:text-brand"
            aria-label="View file"
          >
            <ExternalLink className={cn(isDense ? "size-3" : "size-3.5")} />
          </a>
          <a
            href={downloadUrl ?? url}
            download={name}
            title="Download file"
            className="text-muted-foreground hover:text-brand"
            aria-label="Download file"
          >
            <Download className={cn(isDense ? "size-3" : "size-3.5")} />
          </a>
        </div>
      </div>
    </div>
  );
}

type LocalFilePreviewProps = {
  file: File;
  onRemove: () => void;
  compact?: boolean;
  size?: FilePreviewSize;
};

export function LocalFilePreview({ file, onRemove, compact, size }: LocalFilePreviewProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  return (
    <FilePreview
      name={file.name}
      url={url}
      mimeType={file.type}
      sizeBytes={file.size}
      onRemove={onRemove}
      compact={compact}
      size={size}
    />
  );
}
