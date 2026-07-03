import { useState } from "react";
import { ProjectKanbanCard } from "@/components/projects/project-kanban-card";
import { PROJECT_KANBAN_COLUMNS } from "@/lib/projects/constants";
import type { ProjectSummary } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

type ProjectKanbanBoardProps = {
  projects: ProjectSummary[];
  onStatusChange: (id: string, status: string) => void;
};

export function ProjectKanbanBoard({ projects, onStatusChange }: ProjectKanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const byStatus = (status: string) => projects.filter((p) => p.status === status);

  function handleDrop(columnKey: string) {
    if (!draggingId) return;
    const project = projects.find((p) => p.id === draggingId);
    if (project && project.status !== columnKey) {
      onStatusChange(draggingId, columnKey);
    }
    setDraggingId(null);
    setDragOverColumn(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {PROJECT_KANBAN_COLUMNS.map((col) => (
        <div
          key={col.key}
          className={cn(
            "min-h-[200px] rounded-xl border border-border bg-card p-4 transition-colors",
            dragOverColumn === col.key && "border-brand/50 bg-brand/5",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverColumn(col.key);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOverColumn((prev) => (prev === col.key ? null : prev));
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(col.key);
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className={cn("size-2 rounded-full", col.color)} />
            <span className="text-sm font-semibold">{col.label}</span>
            <span className="text-xs text-muted-foreground">{byStatus(col.key).length}</span>
          </div>

          <div className="space-y-2">
            {byStatus(col.key).map((p) => (
              <ProjectKanbanCard
                key={p.id}
                project={p}
                isDragging={draggingId === p.id}
                onStatusChange={onStatusChange}
                onDragStart={setDraggingId}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverColumn(null);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
