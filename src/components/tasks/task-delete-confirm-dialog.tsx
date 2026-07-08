import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { taskDeleteConfirmMessage } from "@/lib/tasks/delete-task";

type TaskDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubtask?: boolean;
  subtaskCount?: number;
  deleting?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function TaskDeleteConfirmDialog({
  open,
  onOpenChange,
  isSubtask = false,
  subtaskCount = 0,
  deleting = false,
  onConfirm,
}: TaskDeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSubtask ? "Delete subtask?" : "Delete task?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {taskDeleteConfirmMessage({ isSubtask, subtaskCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
