import { TaskFormModal } from "@/components/tasks/task-form-modal";

type EditTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  taskId: string;
  onSuccess: () => void;
};

export function EditTaskModal({ taskId, ...props }: EditTaskModalProps) {
  return <TaskFormModal mode="edit" taskId={taskId} {...props} />;
}
