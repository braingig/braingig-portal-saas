import { useMemo } from "react";
import { LeaveSectionHeader } from "@/components/leave/leave-section-header";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import {
  LEAVE_CARD_LABEL,
  LEAVE_CARD_VALUE,
  LEAVE_DENSE_CARD,
  LEAVE_DENSE_CARD_INTERACTIVE,
  LEAVE_SECONDARY,
} from "@/components/leave/leave-styles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toDateKey } from "@/lib/attendance/date-utils";
import {
  computeLeaveDays,
  formatLeaveDays,
  leaveTypeLabel,
} from "@/lib/leave/calculations";
import type { LeaveBalance, LeaveRequest } from "@/lib/leave/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type PreviewProps = {
  balances: LeaveBalance[];
  onViewDetails: () => void;
  showViewDetails?: boolean;
};

function BalanceMiniCard({
  balance,
  onClick,
}: {
  balance: LeaveBalance;
  onClick: () => void;
}) {
  const remainingPct =
    balance.total > 0 ? Math.min(100, (balance.remaining / balance.total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(LEAVE_DENSE_CARD, LEAVE_DENSE_CARD_INTERACTIVE, "w-full")}
    >
      <p className={LEAVE_CARD_LABEL}>{balance.label}</p>
      <p className={cn(LEAVE_CARD_VALUE, "mt-0.5 text-foreground")}>{balance.remaining}</p>
      <p className={cn(LEAVE_SECONDARY, "mt-0.5")}>
        of {balance.total} days remaining
      </p>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={balance.remaining}
        aria-valuemin={0}
        aria-valuemax={balance.total}
      >
        <div
          className="h-full rounded-full bg-brand/80 transition-all duration-300"
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </button>
  );
}

export function LeaveBalancePreview({
  balances,
  onViewDetails,
  showViewDetails = true,
}: PreviewProps) {
  return (
    <section>
      <LeaveSectionHeader
        title="My Leave Balance"
        actionLabel="View Details"
        onAction={onViewDetails}
        showAction={showViewDetails}
      />
      <div className="grid gap-1.5 sm:grid-cols-3">
        {balances.map((b) => (
          <BalanceMiniCard key={b.leave_type} balance={b} onClick={onViewDetails} />
        ))}
      </div>
    </section>
  );
}

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  userId: string;
  onSelectRequest?: (request: LeaveRequest) => void;
};

function BalanceDetailRow({ balance }: { balance: LeaveBalance }) {
  const remainingPct =
    balance.total > 0 ? Math.min(100, (balance.remaining / balance.total) * 100) : 0;

  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{balance.label}</p>
        <p className="text-sm font-semibold tabular-nums">
          {balance.remaining}{" "}
          <span className="font-normal text-muted-foreground">/ {balance.total}</span>
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand/80"
          style={{ width: `${remainingPct}%` }}
        />
      </div>
      <p className={cn(LEAVE_SECONDARY, "mt-1")}>
        Used {formatLeaveDays(balance.used)}
        {balance.reserved > 0 && <> · Pending {formatLeaveDays(balance.reserved)}</>}
        {" · "}Remaining {formatLeaveDays(balance.remaining)}
      </p>
    </div>
  );
}

export function LeaveBalanceDrawer({
  open,
  onOpenChange,
  balances,
  requests,
  userId,
  onSelectRequest,
}: DrawerProps) {
  const today = toDateKey();

  const historyByType = useMemo(() => {
    const mine = requests.filter((r) => r.user_id === userId);
    return balances.map((b) => ({
      type: b.leave_type,
      label: b.label,
      items: mine.filter(
        (r) =>
          r.leave_type === b.leave_type ||
          (b.leave_type === "casual" && r.leave_type === "personal"),
      ),
    }));
  }, [balances, requests, userId]);

  const upcoming = useMemo(
    () =>
      requests
        .filter((r) => r.user_id === userId && r.status === "approved" && r.end_date >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [requests, userId, today],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Leave Balance</SheetTitle>
          <SheetDescription>Full balances, usage, and upcoming leave.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div>
            <p className={cn(LEAVE_CARD_LABEL, "mb-2")}>Balances</p>
            <div className="space-y-2">
              {balances.map((b) => (
                <BalanceDetailRow key={b.leave_type} balance={b} />
              ))}
            </div>
          </div>

          <div>
            <p className={cn(LEAVE_CARD_LABEL, "mb-2")}>History by Type</p>
            <div className="space-y-3">
              {historyByType.map((group) => (
                <div key={group.type} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-sm font-medium">{group.label}</p>
                  {group.items.length === 0 ? (
                    <p className={cn(LEAVE_SECONDARY, "mt-1")}>No requests</p>
                  ) : (
                    <ul className="mt-1.5 space-y-1">
                      {group.items.slice(0, 5).map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => onSelectRequest?.(r)}
                            className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/50"
                          >
                            <span className="text-muted-foreground">
                              {formatDate(r.start_date)}
                              {r.start_date !== r.end_date && ` – ${formatDate(r.end_date)}`}
                            </span>
                            <LeaveStatusBadge status={r.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={cn(LEAVE_CARD_LABEL, "mb-2")}>Upcoming Approved Leave</p>
            {upcoming.length === 0 ? (
              <p className={cn(LEAVE_SECONDARY, "rounded-lg border border-border px-3 py-2")}>
                No upcoming approved leave.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRequest?.(r)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{leaveTypeLabel(r.leave_type)}</p>
                        <p className={LEAVE_SECONDARY}>
                          {formatDate(r.start_date)}
                          {r.start_date !== r.end_date && ` – ${formatDate(r.end_date)}`}
                          {" · "}
                          {formatLeaveDays(computeLeaveDays(r.start_date, r.end_date, r.half_day))}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
