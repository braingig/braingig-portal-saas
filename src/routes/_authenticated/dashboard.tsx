import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { formatCents } from "@/lib/format";
import { dsCaption, dsSectionTitle, dsStatLabel, dsStatValue } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · WorkPilot" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { orgId } = useOrganization();
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    projects: 0, activeProjects: 0, tasksOpen: 0, tasksDone: 0,
    pipeline: 0, deals: 0, hours: 0, members: 0, pendingLeave: 0,
  });

  useEffect(() => {
    if (!orgId) return;

    const loadStats = () => {
      Promise.all([
        supabase.from("projects").select("id, status, budget").eq("organization_id", orgId),
        supabase.from("tasks").select("id, status").eq("organization_id", orgId),
        supabase.from("deals").select("id, value, stage").eq("organization_id", orgId),
        supabase.from("time_entries").select("duration_seconds").eq("organization_id", orgId),
        supabase.from("organization_members").select("id").eq("organization_id", orgId),
        supabase.from("leave_requests").select("id, status").eq("organization_id", orgId),
      ]).then(([projects, tasks, deals, time, members, leave]) => {
        const pList = projects.data ?? [];
        const tList = tasks.data ?? [];
        const dList = (deals.data ?? []).filter((d) => !["won", "lost"].includes(d.stage));
        setStats({
          projects: pList.length,
          activeProjects: pList.filter((p) => p.status === "in_progress").length,
          tasksOpen: tList.filter((t) => t.status !== "done").length,
          tasksDone: tList.filter((t) => t.status === "done").length,
          pipeline: dList.reduce((s, d) => s + (d.value ?? 0), 0) * 100,
          deals: dList.length,
          hours: Math.round((time.data ?? []).reduce((s, t) => s + (t.duration_seconds ?? 0), 0) / 36) / 100,
          members: members.data?.length ?? 0,
          pendingLeave: (leave.data ?? []).filter((l) => l.status === "pending").length,
        });
      });
    };

    loadStats();

    const channel = supabase
      .channel(`dashboard-leave-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests", filter: `organization_id=eq.${orgId}` },
        () => loadStats(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  const name = profile?.full_name?.split(" ")[0] ?? "there";
  const taskRate = stats.tasksOpen + stats.tasksDone ? Math.round((stats.tasksDone / (stats.tasksOpen + stats.tasksDone)) * 100) : 0;

  if (!orgId) return <AppShell title="Dashboard"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Executive Dashboard" subtitle={`Welcome back, ${name}. Here's what's happening today.`}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          <KPI label="Active Projects" value={String(stats.activeProjects)} delta={`${stats.projects} total`} trend="up" />
          <KPI label="Open Tasks" value={String(stats.tasksOpen)} delta={`${taskRate}% done`} trend={taskRate > 50 ? "up" : "down"} />
          <KPI label="Pipeline" value={formatCents(stats.pipeline)} delta={`${stats.deals} deals`} trend="up" />
          <KPI label="Hours Tracked" value={String(stats.hours)} delta="This org" trend="up" />
          <KPI label="Team Size" value={String(stats.members)} delta="Members" trend="up" />
          <KPI label="Leave Pending" value={String(stats.pendingLeave)} delta="Requests" trend={stats.pendingLeave > 0 ? "down" : "up"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Label>Project health</Label>
            <div className="mt-4 space-y-3">
              <Row label="In progress" value={String(stats.activeProjects)} pct={stats.projects ? (stats.activeProjects / stats.projects) * 100 : 0} color="bg-brand" />
              <Row label="Other statuses" value={String(stats.projects - stats.activeProjects)} pct={stats.projects ? ((stats.projects - stats.activeProjects) / stats.projects) * 100 : 0} color="bg-muted-foreground" />
            </div>
          </Card>
          <Card>
            <Label>Task completion</Label>
            <div className="mt-4 flex items-end gap-4">
              <span className={dsSectionTitle}>{taskRate}%</span>
              <p className={cn(dsCaption, "pb-2")}>{stats.tasksDone} of {stats.tasksOpen + stats.tasksDone} tasks complete</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-xl border border-border bg-card p-5">{children}</section>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <h3 className={dsStatLabel}>{children}</h3>;
}
function KPI({ label, value, delta, trend }: { label: string; value: string; delta: string; trend: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span className={dsStatLabel}>{label}</span>
      <p className={cn(dsStatValue, "mt-2")}>{value}</p>
      <p className={cn("mt-1 flex items-center gap-1 text-xs", trend === "up" ? "text-success" : "text-danger")}>
        {trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{delta}
      </p>
    </div>
  );
}
function Row({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="font-mono">{value}</span></div>
      <div className="h-1.5 rounded-full bg-surface-2"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
