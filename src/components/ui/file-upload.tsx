import { useRef } from "react";
import { Upload } from "lucide-react";
import { LocalFilePreview } from "@/components/ui/file-preview";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  id: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
};

export function FileUpload({
  id,
  files,
  onFilesChange,
  accept,
  multiple = true,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming?.length) return;
    const next = multiple ? [...files, ...Array.from(incoming)] : [incoming[0]];
    onFilesChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <label
        htmlFor={id}
        className="flex min-h-[72px] cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-4 py-3 transition-colors hover:border-brand/40 hover:bg-surface-2/60"
      >
        <Upload className="size-5 shrink-0 text-muted-foreground" />
        <div className="text-left">
          <p className="text-sm font-medium">
            {multiple ? "Choose files" : "Choose a file"}
          </p>
          <p className="text-xs text-muted-foreground">
            {multiple ? "Select one or more files · click to browse" : "Click to browse"}
          </p>
        </div>
      </label>

      {files.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {files.map((file, index) => (
            <LocalFilePreview
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              onRemove={() => removeFile(index)}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
