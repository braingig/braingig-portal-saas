import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/ui/back-link";
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
import {
  fetchProjectActivityAudits,
  type ProjectActivityAudit,
} from "@/lib/projects/project-activity";
import type { ProjectMilestone, ProjectOwner, ProjectRecord, ProjectSubtask, ProjectTask } from "@/lib/projects/types";
import { toast } from "sonner";

type ProjectDetailsPageViewProps = {
  projectId: string;
};

export function ProjectDetailsPageView({ projectId }: ProjectDetailsPageViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgId } = useOrganization();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [owner, setOwner] = useState<ProjectOwner | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [subtasksByParent, setSubtasksByParent] = useState<Map<string, ProjectSubtask[]>>(new Map());
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [audits, setAudits] = useState<ProjectActivityAudit[]>([]);
  const [taskTitles, setTaskTitles] = useState<Map<string, string>>(new Map());
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadAudits = useCallback(async () => {
    if (!orgId || !projectId) return;
    try {
      const { audits: rows, taskTitles: titles } = await fetchProjectActivityAudits(projectId, orgId);
      setAudits(rows);
      setTaskTitles(titles);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load activity");
    }
  }, [orgId, projectId]);

  const load = useCallback(async () => {
    if (!orgId || !projectId) return;

    const [pRes, tRes, mRes, subRes] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("organization_id", orgId)
        .single(),
      supabase
        .from("tasks")
        .select("id, title, status, due_date, assignee_id, milestone_id, project_id")
        .eq("project_id", projectId)
        .is("parent_id", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("milestones")
        .select("id, title, project_id, position")
        .eq("project_id", projectId)
        .order("position", { ascending: true }),
      supabase
        .from("tasks")
        .select("id, title, status, parent_id")
        .eq("project_id", projectId)
        .not("parent_id", "is", null)
        .order("position", { ascending: true }),
    ]);

    if (pRes.error) toast.error(pRes.error.message);
    else if (pRes.data) {
      const record = pRes.data as ProjectRecord;
      setProject(record);
      if (record.owner_id) {
        const { data: ownerData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", record.owner_id)
          .maybeSingle();
        setOwner(ownerData);
        setOwnerName(ownerData?.full_name ?? null);
      } else {
        setOwner(null);
        setOwnerName(null);
      }
    }

    if (tRes.error) toast.error("Failed to load tasks: " + tRes.error.message);
    else if (tRes.data) setTasks(tRes.data as ProjectTask[]);

    if (subRes.error) toast.error("Failed to load subtasks: " + subRes.error.message);
    else {
      const grouped = new Map<string, ProjectSubtask[]>();
      for (const row of subRes.data ?? []) {
        if (!row.parent_id) continue;
        const list = grouped.get(row.parent_id) ?? [];
        list.push({ id: row.id, title: row.title, status: row.status });
        grouped.set(row.parent_id, list);
      }
      setSubtasksByParent(grouped);
    }

    if (mRes.error) toast.error("Failed to load folders: " + mRes.error.message);
    else if (mRes.data) setMilestones(mRes.data as ProjectMilestone[]);

    await loadAudits();
    setLoading(false);
  }, [orgId, projectId, loadAudits]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`org-${orgId}-project-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "milestones", filter: `project_id=eq.${projectId}` }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs", filter: `organization_id=eq.${orgId}` }, () => { void loadAudits(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, projectId, load, loadAudits]);

  const nameOf = useCallback(
    (actorId: string | null | undefined) => {
      if (!actorId) return "Someone";
      if (actorId === user?.id) return "You";
      if (project?.owner_id === actorId && ownerName) return ownerName;
      return ownerName && actorId === project?.owner_id ? ownerName : "Someone";
    },
    [user?.id, project?.owner_id, ownerName],
  );

  async function handleStatusChange(status: string) {
    if (!project) return;
    const previous = project.status;
    const { error } = await supabase.from("projects").update({ status }).eq("id", project.id);
    if (error) toast.error(error.message);
    else {
      setProject({ ...project, status });
      await logAudit("project.updated", "project", project.id, {
        field: "status",
        value: status,
        previous,
      });
      void loadAudits();
    }
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
      <AppShell>
        <BackLink to="/projects" className="mb-4">Back to projects</BackLink>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <BackLink to="/projects" className="mb-4">Back to projects</BackLink>
        <div className="text-sm text-muted-foreground">This project could not be found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProjectDetailsLayout
        header={(
          <ProjectDetailsHeader
            project={project}
            owner={owner}
            onEdit={() => setShowEditModal(true)}
            onDelete={() => void handleDelete()}
            onStatusChange={handleStatusChange}
          />
        )}
        main={(
          <>
            <ProjectDetailsDescription project={project} />
            {user && orgId && (
              <ProjectDetailsTasks
                projectId={projectId}
                orgId={orgId}
                userId={user.id}
                tasks={tasks}
                subtasksByParent={subtasksByParent}
                milestones={milestones}
                onChange={load}
              />
            )}
            {orgId && <ProjectDetailsAttachments project={project} orgId={orgId} />}
          </>
        )}
        sidebar={(
          <ProjectDetailsSidebar
            project={project}
            tasks={tasks}
            audits={audits}
            taskTitles={taskTitles}
            nameOf={nameOf}
            onEditNote={() => setShowEditModal(true)}
          />
        )}
      />

      {user && orgId && (
        <ProjectFormModal
          mode="edit"
          open={showEditModal}
          onOpenChange={setShowEditModal}
          orgId={orgId}
          userId={user.id}
          project={project}
          onSuccess={() => { void load(); }}
        />
      )}
    </AppShell>
  );
}
