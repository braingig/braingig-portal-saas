import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { formatCents } from "@/lib/format";
import { dsCaption, dsStatLabel, dsStatValue } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type Stats = {
  projects: number; activeProjects: number; tasks: number; doneTasks: number;
  deals: number; pipeline: number; hours: number; members: number;
};

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports · WorkPilot" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { orgId } = useOrganization();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from("projects").select("id, status, budget").eq("organization_id", orgId),
      supabase.from("tasks").select("id, status").eq("organization_id", orgId),
      supabase.from("deals").select("id, value, stage").eq("organization_id", orgId),
      supabase.from("time_entries").select("duration_seconds").eq("organization_id", orgId),
      supabase.from("organization_members").select("id").eq("organization_id", orgId),
    ]).then(([projects, tasks, deals, time, members]) => {
      const pList = projects.data ?? [];
      const tList = tasks.data ?? [];
      const dList = (deals.data ?? []).filter((d) => d.stage !== "won" && d.stage !== "lost");
      const hours = (time.data ?? []).reduce((s, t) => s + (t.duration_seconds ?? 0), 0) / 3600;
      setStats({
        projects: pList.length,
        activeProjects: pList.filter((p) => p.status === "in_progress").length,
        tasks: tList.length,
        doneTasks: tList.filter((t) => t.status === "done").length,
        deals: dList.length,
        pipeline: dList.reduce((s, d) => s + (d.value ?? 0), 0) * 100,
        hours: Math.round(hours * 10) / 10,
        members: members.data?.length ?? 0,
      });
    });
  }, [orgId]);

  if (!orgId || !stats) return <AppShell title="Reports"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  const taskRate = stats.tasks ? Math.round((stats.doneTasks / stats.tasks) * 100) : 0;

  return (
    <AppShell title="Reports" subtitle="Organization analytics">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active projects", value: stats.activeProjects, sub: `${stats.projects} total` },
          { label: "Task completion", value: `${taskRate}%`, sub: `${stats.doneTasks}/${stats.tasks} done` },
          { label: "Pipeline value", value: formatCents(stats.pipeline), sub: `${stats.deals} deals` },
          { label: "Hours tracked", value: stats.hours, sub: `${stats.members} team members` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className={dsStatLabel}>{s.label}</p>
            <p className={cn(dsStatValue, "mt-2")}>{s.value}</p>
            <p className={cn(dsCaption, "mt-1")}>{s.sub}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
