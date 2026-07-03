import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { createProjectFolder } from "@/lib/projects/folders";
import { toast } from "sonner";

type CreateFolderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  projectId: string;
  userId: string;
  folderCount: number;
  onCreated: (folderId: string) => void;
};

export function CreateFolderModal({
  open,
  onOpenChange,
  orgId,
  projectId,
  userId,
  folderCount,
  onCreated,
}: CreateFolderModalProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) setTitle("");
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setSubmitting(true);
    try {
      const folder = await createProjectFolder(orgId, projectId, userId, title, folderCount);
      toast.success("Folder created");
      onCreated(folder.id);
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="New folder"
      description="Create a folder to organize tasks within this project."
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="border-border bg-background hover:bg-surface"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-folder-form"
            disabled={submitting}
            className="bg-brand text-brand-foreground hover:brightness-110"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create folder
          </Button>
        </>
      }
    >
      <form id="create-folder-form" onSubmit={handleSubmit}>
        <FormField label="Folder name" htmlFor="folder-name" required>
          <Input
            id="folder-name"
            autoFocus
            placeholder="e.g. Design, Development, QA"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-surface border-border"
          />
        </FormField>
      </form>
    </AppModal>
  );
}
