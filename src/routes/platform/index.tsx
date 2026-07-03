import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, CreditCard, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/platform/")({
  head: () => ({ meta: [{ title: "Platform · WorkPilot" }] }),
  component: PlatformDashboard,
});

function PlatformDashboard() {
  const [stats, setStats] = useState({ orgs: 0, members: 0, active: 0, trialing: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("organizations").select("id, status", { count: "exact" }),
      supabase.from("organization_members").select("id", { count: "exact", head: true }),
      supabase.from("organization_subscriptions").select("status"),
    ]).then(([orgs, members, subs]) => {
      const orgList = orgs.data ?? [];
      const subList = subs.data ?? [];
      setStats({
        orgs: orgs.count ?? orgList.length,
        members: members.count ?? 0,
        active: orgList.filter((o) => o.status === "active").length,
        trialing: subList.filter((s) => s.status === "trialing").length,
      });
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all agencies on WorkPilot.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total agencies", value: stats.orgs, icon: Building2 },
          { label: "Total members", value: stats.members, icon: Users },
          { label: "Active agencies", value: stats.active, icon: TrendingUp },
          { label: "On trial", value: stats.trialing, icon: CreditCard },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <s.icon className="size-5 text-violet-500 mb-3" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
