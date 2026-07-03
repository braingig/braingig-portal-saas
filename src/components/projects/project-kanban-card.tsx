import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ProjectStatusPicker } from "@/components/projects/project-status-picker";
import { formatProjectEndDate } from "@/lib/format";
import type { ProjectSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 6;

type ProjectKanbanCardProps = {
  project: ProjectSummary;
  isDragging: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

function isActionTarget(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest("[data-card-action]"));
}

export function ProjectKanbanCard({
  project: p,
  isDragging,
  onStatusChange,
  onDragStart,
  onDragEnd,
}: ProjectKanbanCardProps) {
  const navigate = useNavigate();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const pointerMoved = useRef(false);
  const dragActive = useRef(false);

  const totalSeconds = p.time_entries?.reduce((a, b) => a + (b.duration_seconds || 0), 0) || 0;
  const doneTasks = p.tasks?.filter((t) => t.status === "done").length ?? 0;
  const taskCount = p.tasks?.length ?? 0;

  function goToDetails() {
    navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (isActionTarget(e.target)) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    pointerMoved.current = false;
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
      pointerMoved.current = true;
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (isActionTarget(e.target)) {
      pointerStart.current = null;
      return;
    }

    const shouldNavigate = pointerStart.current && !pointerMoved.current && !dragActive.current;
    pointerStart.current = null;
    pointerMoved.current = false;

    if (shouldNavigate) {
      goToDetails();
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        dragActive.current = true;
        pointerMoved.current = true;
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(p.id);
      }}
      onDragEnd={() => {
        onDragEnd();
        setTimeout(() => {
          dragActive.current = false;
        }, 50);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-background p-3 transition-colors hover:border-brand/40",
        isDragging && "opacity-40 ring-2 ring-brand/30",
        "active:cursor-grabbing",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{p.name}</p>
        {p.client && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{p.client}</p>}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div data-card-action onPointerDown={(e) => e.stopPropagation()}>
          <ProjectStatusPicker
            status={p.status}
            onChange={(status) => onStatusChange(p.id, status)}
          />
        </div>
        <span className="truncate text-[10px] text-muted-foreground">
          {formatProjectEndDate(p.end_date, p.due_date)}
        </span>
      </div>

      {(p.budget != null || p.hourly_rate != null) && (
        <div className="mt-2 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
          {p.budget != null && <span>Budget: ${p.budget.toLocaleString()}</span>}
          {p.hourly_rate != null && <span>Rate: ${p.hourly_rate}/hr</span>}
        </div>
      )}

      {p.tasks && taskCount > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{doneTasks} / {taskCount} tasks</span>
            <span>{Math.round((doneTasks / taskCount) * 100)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${(doneTasks / taskCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-2 text-[10px] text-muted-foreground">
        Time: {Math.floor(totalSeconds / 3600)}h {Math.floor((totalSeconds % 3600) / 60)}m
      </div>
    </div>
  );
}