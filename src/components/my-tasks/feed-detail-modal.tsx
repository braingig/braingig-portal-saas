import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type FeedDetailItem = {
  id: string;
  kind: "mention" | "comment";
  title: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
  projectId: string | null;
  projectName: string | null;
  body?: string | null;
};

type FeedDetailModalProps = {
  item: FeedDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTask: (taskId: string) => void;
};

export function FeedDetailModal({ item, open, onOpenChange, onOpenTask }: FeedDetailModalProps) {
  if (!item) return null;

  const when = format(new Date(item.createdAt), "EEEE, MMM d 'at' h:mm a");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block w-full max-w-[min(420px,92vw)] gap-0 border border-border/60 bg-card p-0 shadow-lg sm:rounded-lg">
        <div className="px-5 pb-5 pt-5 pr-11">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {item.kind === "mention" ? "Mention" : "Comment"}
          </p>
          <h2 className="mt-1 text-sm font-medium leading-snug text-foreground">{item.title}</h2>
          <time className="mt-1 block text-[11px] text-muted-foreground">{when}</time>

          <dl className="mt-4 space-y-2.5">
            <div className="grid grid-cols-[4.5rem_1fr] items-baseline gap-2">
              <dt className="text-[11px] text-muted-foreground">Task</dt>
              <dd>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenTask(item.taskId);
                  }}
                  className="text-left text-xs text-brand hover:underline"
                >
                  {item.taskTitle}
                </button>
              </dd>
            </div>
            <div className="grid grid-cols-[4.5rem_1fr] items-baseline gap-2">
              <dt className="text-[11px] text-muted-foreground">Project</dt>
              <dd className="text-xs text-foreground">
                {item.projectId && item.projectName ? (
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: item.projectId }}
                    className="text-brand hover:underline"
                    onClick={() => onOpenChange(false)}
                  >
                    {item.projectName}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">No project</span>
                )}
              </dd>
            </div>
          </dl>

          {item.body && (
            <p className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
