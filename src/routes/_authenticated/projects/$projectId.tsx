import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProjectDetailsAttachments } from "@/components/projects/details/project-details-attachments";
import { ProjectDetailsDescription } from "@/components/projects/details/project-details-description";
import { ProjectDetailsHeader } from "@/components/projects/details/project-details-header";
import { ProjectDetailsLayout } from "@/components/projects/details/project-details-layout";
import { ProjectDetailsSidebar } from "@/components/projects/details/project-details-sidebar";
import { ProjectDetailsTasks } from "@/components/projects/details/project-details-tasks";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { logAudit } from "@/lib/audit";
import type { ProjectMilestone, ProjectOwner, ProjectRecord, ProjectTask } from "@/lib/projects/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: ({ params }) => ({ meta: [{ title: `Project · ${params.projectId}` }] }),
  component: ProjectDetailsPage,
});

function ProjectDetailsPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [owner, setOwner] = useState<ProjectOwner | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  async function load() {
    if (!orgId || !projectId) return;

    const [pRes, tRes, mRes] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("organization_id", orgId)
        .single(),
      supabase
        .from("tasks")
        .select("id, title, status, due_date, assignee_id, milestone_id")
        .eq("project_id", projectId)
        .is("parent_id", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("milestones")
        .select("id, title, project_id, position")
        .eq("project_id", projectId)
        .order("position", { ascending: true }),
    ]);

    if (pRes.error) toast.error(pRes.error.message);
    else if (pRes.data) {
      setProject(pRes.data as ProjectRecord);
      if (pRes.data.owner_id) {
        const { data: ownerData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", pRes.data.owner_id)
          .maybeSingle();
        setOwner(ownerData);
      }
    }

    if (tRes.error) toast.error("Failed to load tasks: " + tRes.error.message);
    else if (tRes.data) setTasks(tRes.data as ProjectTask[]);

    if (mRes.error) toast.error("Failed to load folders: " + mRes.error.message);
    else if (mRes.data) setMilestones(mRes.data as ProjectMilestone[]);

    setLoading(false);
  }

  useEffect(() => { load(); }, [orgId, projectId]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`org-${orgId}-project-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "milestones", filter: `project_id=eq.${projectId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, projectId]);

  async function handleStatusChange(status: string) {
    if (!project) return;
    const { error } = await supabase.from("projects").update({ status }).eq("id", project.id);
    if (error) toast.error(error.message);
    else setProject({ ...project, status });
  }

  async function handleDelete() {
    if (!project || !confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", project.id);
    await logAudit("project.deleted", "project", project.id);
    toast.success("Project deleted");
    navigate({ to: "/projects" });
  }

  if (loading) {
    return (
      <AppShell title="Project">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Project not found">
        <div className="text-sm text-muted-foreground">This project could not be found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProjectDetailsLayout
        header={
          <ProjectDetailsHeader
            project={project}
            onEdit={() => setShowEditModal(true)}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        }
        main={
          <>
            <ProjectDetailsDescription project={project} />
            {orgId && <ProjectDetailsAttachments project={project} orgId={orgId} />}
            {user && orgId && (
              <ProjectDetailsTasks
                projectId={projectId}
                orgId={orgId}
                userId={user.id}
                tasks={tasks}
                milestones={milestones}
                onChange={load}
              />
            )}
          </>
        }
        sidebar={
          <ProjectDetailsSidebar
            project={project}
            owner={owner}
            onEditNote={() => setShowEditModal(true)}
          />
        }
      />

      {user && orgId && (
        <ProjectFormModal
          mode="edit"
          open={showEditModal}
          onOpenChange={setShowEditModal}
          orgId={orgId}
          userId={user.id}
          project={project}
          onSuccess={load}
        />
      )}
    </AppShell>
  );
}
