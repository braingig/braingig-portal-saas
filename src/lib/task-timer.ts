export type ActiveTaskTimer = {
  taskId: string;
  taskTitle: string;
  projectId: string | null;
  startedAt: number;
  elapsedBefore: number;
};

const STORAGE_KEY = "workpilot_active_task_timer";
const EVENT = "workpilot:timer-changed";

export function getActiveTaskTimer(): ActiveTaskTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveTaskTimer) : null;
  } catch {
    return null;
  }
}

export function setActiveTaskTimer(timer: ActiveTaskTimer | null) {
  if (timer) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function getTimerElapsedSeconds(timer: ActiveTaskTimer): number {
  return timer.elapsedBefore + Math.floor((Date.now() - timer.startedAt) / 1000);
}

export function subscribeTaskTimer(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function formatTimerSeconds(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Human-readable duration, e.g. "2h 21m 54s" */
export function formatDurationHuman(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}
