import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Org = {
  id: string; name: string; slug: string; status: string;
  created_at: string;
  member_count?: number;
  plan_name?: string;
};

export const Route = createFileRoute("/platform/organizations")({
  head: () => ({ meta: [{ title: "Agencies · Platform" }] }),
  component: PlatformOrgs,
});

function PlatformOrgs() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: orgData } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    const { data: subs } = await supabase.from("organization_subscriptions").select("organization_id, subscription_plans(name)");
    const { data: members } = await supabase.from("organization_members").select("organization_id");

    const subMap = new Map((subs ?? []).map((s) => [s.organization_id, (s.subscription_plans as { name: string } | null)?.name]));
    const memberCounts = new Map<string, number>();
    (members ?? []).forEach((m) => memberCounts.set(m.organization_id, (memberCounts.get(m.organization_id) ?? 0) + 1));

    setOrgs((orgData ?? []).map((o) => ({
      ...o,
      member_count: memberCounts.get(o.id) ?? 0,
      plan_name: subMap.get(o.id) ?? "—",
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("organizations").update({ status: status as never }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Agency ${status}`);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agencies</h1>
        <p className="text-sm text-muted-foreground mt-1">{orgs.length} registered workspaces</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_100px_140px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          <div>Agency</div><div>Plan</div><div>Members</div><div>Status</div><div>Actions</div>
        </div>
        {orgs.map((o) => (
          <div key={o.id} className="grid grid-cols-[1fr_120px_100px_100px_140px] gap-3 px-4 py-3 items-center border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium">{o.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{o.slug}</p>
            </div>
            <div className="text-xs">{o.plan_name}</div>
            <div className="text-xs font-mono">{o.member_count}</div>
            <div><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${o.status === "active" ? "bg-success/10 text-success" : o.status === "suspended" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>{o.status}</span></div>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="text-xs bg-background border border-border rounded-md px-2 py-1">
              {["trial", "active", "suspended", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
