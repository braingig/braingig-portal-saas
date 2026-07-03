import { TaskFormModal } from "@/components/tasks/task-form-modal";

type CreateTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  defaultProjectId?: string;
  defaultMilestoneId?: string;
  parentTaskId?: string;
  subtaskPosition?: number;
  onSuccess: () => void;
};

export function CreateTaskModal(props: CreateTaskModalProps) {
  return <TaskFormModal mode="create" {...props} />;
}
