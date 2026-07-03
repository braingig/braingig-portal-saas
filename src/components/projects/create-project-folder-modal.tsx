import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CreateProjectFolderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  orgId: string;
  userId: string;
  folderCount: number;
  onSuccess: () => void;
};

export function CreateProjectFolderModal({
  open,
  onOpenChange,
  projectId,
  orgId,
  userId,
  folderCount,
  onSuccess,
}: CreateProjectFolderModalProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setTitle("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) {
      toast.error("Folder name is required");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("milestones").insert({
      project_id: projectId,
      organization_id: orgId,
      title: name,
      created_by: userId,
      position: folderCount,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Folder created");
    onSuccess();
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="New folder"
      description="Create a folder to organize tasks on this project."
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
            className="bg-surface border-border focus-visible:ring-brand/30"
          />
        </FormField>
      </form>
    </AppModal>
  );
}
