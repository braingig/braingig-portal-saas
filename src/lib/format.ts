export function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: string | null | undefined) {
  if (!d) return "Never";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeLogin(d: string | null | undefined) {
  if (!d) return "Never logged in";

  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const isSameDay = date.toDateString() === now.toDateString();
    if (isSameDay) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  return formatDate(d);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export type LastLoginParts = {
  time: string;
  label: string;
};

/** Time on first line; second line is Today, Yesterday, or the date. */
export function formatLastLoginParts(d: string | null | undefined): LastLoginParts | null {
  if (!d) return null;

  const date = new Date(d);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = formatTime(date);

  if (date.toDateString() === now.toDateString()) {
    return { time, label: "Today" };
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return { time, label: "Yesterday" };
  }
  return { time, label: formatDate(d) };
}

/** @deprecated Use formatLastLoginParts for two-line display. */
export function formatLastLogin(d: string | null | undefined) {
  const parts = formatLastLoginParts(d);
  if (!parts) return "Never logged in";
  return `${parts.time} · ${parts.label}`;
}

export function formatRelativeTime(d: string | null | undefined) {
  if (!d) return null;

  const date = new Date(d);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hr ago`;

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;

  const years = Math.floor(days / 365);
  return `${years}yr ago`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatProjectEndDate(
  endDate: string | null | undefined,
  dueDate?: string | null | undefined,
) {
  const d = endDate ?? dueDate;
  if (!d) return "No end date";
  return formatDate(d);
}

export function formatProjectTimeline(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  dueDate?: string | null | undefined,
) {
  const end = endDate ?? dueDate;
  if (startDate && end) return `${formatDate(startDate)} – ${formatDate(end)}`;
  if (startDate) return `From ${formatDate(startDate)}`;
  if (end) return `Until ${formatDate(end)}`;
  return "Not set";
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent?.trim() ?? "";
  }
  return html.replace(/<[^>]*>/g, "").trim();
}
