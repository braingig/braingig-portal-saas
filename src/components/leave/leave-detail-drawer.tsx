import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { LEAVE_SECONDARY } from "@/components/leave/leave-styles";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { computeLeaveDays, formatLeaveDays, leaveTypeLabel } from "@/lib/leave/calculations";
import type { LeaveRequest } from "@/lib/leave/types";
import { formatDate, formatDateTime } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequest | null;
  canApprove?: boolean;
  onOpenApprove?: () => void;
  onOpenReject?: () => void;
  onComment?: (comment: string) => Promise<void>;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className={LEAVE_SECONDARY}>{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function CommentForm({ onComment }: { onComment: (comment: string) => Promise<void> }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await onComment(comment.trim());
      setComment("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment"
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
      <Button variant="outline" className="w-full" disabled={busy || !comment.trim()} onClick={submit}>
        Add Comment
      </Button>
    </div>
  );
}

export function LeaveDetailDrawer({
  open,
  onOpenChange,
  request,
  canApprove,
  onOpenApprove,
  onOpenReject,
  onComment,
}: Props) {
  if (!request) return null;

  const days = computeLeaveDays(request.start_date, request.end_date, request.half_day);
  const isPending = request.status === "pending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>{leaveTypeLabel(request.leave_type)}</SheetTitle>
          <SheetDescription>
            {request.user_name ? `${request.user_name} · ` : ""}
            {formatDate(request.start_date)}
            {request.start_date !== request.end_date && ` – ${formatDate(request.end_date)}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 divide-y divide-border rounded-lg border border-border px-3">
          <DetailRow label="Leave Type" value={leaveTypeLabel(request.leave_type)} />
          <DetailRow label="Requested On" value={formatDateTime(request.created_at)} />
          <DetailRow
            label="Date Range"
            value={
              request.start_date === request.end_date
                ? formatDate(request.start_date)
                : `${formatDate(request.start_date)} – ${formatDate(request.end_date)}`
            }
          />
          <DetailRow label="Number of Days" value={formatLeaveDays(days)} />
          <DetailRow label="Reason" value={request.reason ?? "—"} />
          <DetailRow
            label="Attachment"
            value={
              request.attachment_url ? (
                <a
                  href={request.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  View file
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <div className="flex items-center justify-between py-2">
            <span className={LEAVE_SECONDARY}>Status</span>
            <LeaveStatusBadge status={request.status} />
          </div>
        </div>

        {(request.reviewer_name || request.reviewed_at || request.review_comment) && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Approval Details
            </p>
            <div className="divide-y divide-border rounded-lg border border-border px-3">
              <DetailRow label="Approver" value={request.reviewer_name ?? "—"} />
              <DetailRow
                label="Approval Date"
                value={request.reviewed_at ? formatDateTime(request.reviewed_at) : "—"}
              />
              <DetailRow label="Comments" value={request.review_comment ?? "—"} />
            </div>
          </div>
        )}

        {canApprove && isPending && (
          <div className="mt-5 flex gap-2">
            <Button
              className="flex-1 bg-success text-white hover:bg-success/90"
              onClick={onOpenApprove}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-danger/30 text-danger hover:bg-danger/10"
              onClick={onOpenReject}
            >
              Reject
            </Button>
          </div>
        )}

        {canApprove && !isPending && onComment && <CommentForm onComment={onComment} />}
      </SheetContent>
    </Sheet>
  );
}
