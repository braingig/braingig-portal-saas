import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import type { ProjectSummary } from "@/lib/projects/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({ meta: [{ title: "Projects · WorkPilot" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function load() {
    if (!orgId) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*, tasks(id, status), time_entries(duration_seconds)")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });

    if (error) toast.error("Failed to load projects: " + error.message);
    setProjects((data ?? []) as ProjectSummary[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [orgId]);

  async function moveProject(id: string, status: string) {
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status: " + error.message);
      return;
    }
    setProjects((p) => p.map((x) => x.id === id ? { ...x, status } : x));
  }

  if (!orgId || loading) {
    return (
      <AppShell title="Projects">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Projects"
      subtitle={`${projects.length} projects`}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground transition-all hover:brightness-110"
        >
          <Plus className="size-3.5" /> New project
        </button>
      }
    >
      {user && (
        <CreateProjectModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          orgId={orgId}
          userId={user.id}
          onCreated={load}
        />
      )}

      <ProjectKanbanBoard
        projects={projects}
        onStatusChange={moveProject}
      />
    </AppShell>
  );
}
