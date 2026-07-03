import { ProjectFormModal } from "@/components/projects/project-form-modal";

type CreateProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  onCreated: () => void;
};

export function CreateProjectModal(props: CreateProjectModalProps) {
  return (
    <ProjectFormModal
      mode="create"
      open={props.open}
      onOpenChange={props.onOpenChange}
      orgId={props.orgId}
      userId={props.userId}
      onSuccess={props.onCreated}
    />
  );
}
