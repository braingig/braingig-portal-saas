import { useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { leaveTypeLabel } from "@/lib/leave/calculations";
import type { LeaveRequest } from "@/lib/leave/types";
import { formatDate } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "approve" | "reject";
  request: LeaveRequest | null;
  onConfirm: (comment?: string) => Promise<void>;
};

export function LeaveReviewModal({ open, onOpenChange, mode, request, onConfirm }: Props) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!request) return null;

  const isApprove = mode === "approve";
  const title = isApprove ? "Approve Leave" : "Reject Leave";
  const description = isApprove
    ? `Approve ${request.user_name ? `${request.user_name}'s` : "this"} ${leaveTypeLabel(request.leave_type)} request?`
  : `Reject ${request.user_name ? `${request.user_name}'s` : "this"} ${leaveTypeLabel(request.leave_type)} request?`;

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm(comment.trim() || undefined);
      setComment("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            className={isApprove ? "bg-success text-white hover:bg-success/90" : "bg-danger text-white hover:bg-danger/90"}
            disabled={busy}
            onClick={handleConfirm}
          >
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface/50 px-3 py-2 text-sm">
          <p className="font-medium">{leaveTypeLabel(request.leave_type)}</p>
          <p className="text-muted-foreground">
            {formatDate(request.start_date)}
            {request.start_date !== request.end_date && ` – ${formatDate(request.end_date)}`}
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Comment (optional)</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isApprove ? "Add an approval note…" : "Add a reason for rejection…"}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>
      </div>
    </AppModal>
  );
}
