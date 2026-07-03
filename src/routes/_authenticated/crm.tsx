import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { logAudit } from "@/lib/audit";
import { formatCents } from "@/lib/format";
import { dsBadge, dsCaption, dsStatLabel } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Deal = {
  id: string; name: string; company: string | null; value: number | null;
  stage: string; expected_close: string | null; position: number;
};

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "Sales CRM · WorkPilot" }] }),
  component: CRMPage,
});

function CRMPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [form, setForm] = useState({ name: "", company: "", value: "" });

  async function load() {
    if (!orgId) return;
    const { data } = await supabase.from("deals").select("*").eq("organization_id", orgId).order("position");
    setDeals((data ?? []) as Deal[]);
  }

  useEffect(() => { load(); }, [orgId]);

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !orgId) return;
    const { error } = await supabase.from("deals").insert({
      name: form.name.trim(), company: form.company || null,
      value: form.value ? parseFloat(form.value) : 0,
      organization_id: orgId, owner_id: user.id, stage: "lead",
      position: deals.length,
    });
    if (error) { toast.error(error.message); return; }
    await logAudit("deal.created", "deal", undefined, { name: form.name });
    setForm({ name: "", company: "", value: "" });
    load();
  }

  async function moveDeal(id: string, stage: string) {
    await supabase.from("deals").update({ stage }).eq("id", id);
    setDeals((d) => d.map((x) => x.id === id ? { ...x, stage } : x));
  }

  const pipeline = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const total = pipeline.reduce((s, d) => s + (d.value ?? 0), 0);

  if (!orgId) return <AppShell title="Sales CRM"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Sales CRM" subtitle={`${formatCents(total * 100)} weighted pipeline · ${deals.length} deals`}
      actions={<span className="text-xs text-muted-foreground">{pipeline.length} active</span>}>
      <form onSubmit={createDeal} className="mb-6 rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3">
        <input required placeholder="Deal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="flex-1 min-w-[140px] bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <input placeholder="Value $" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-28 bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand text-brand-foreground text-sm font-semibold"><Plus className="size-3.5" /> Add deal</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-xl border border-border bg-card p-3">
            <p className={cn(dsStatLabel, "mb-2")}>{stage}</p>
            <div className="space-y-2">
              {deals.filter((d) => d.stage === stage).map((d) => (
                <div key={d.id} className="rounded-md border border-border bg-background p-2">
                  <p className={cn(dsBadge, "truncate")}>{d.name}</p>
                  <p className={dsCaption}>{d.company}</p>
                  <p className="text-xs font-mono mt-1">{formatCents((d.value ?? 0) * 100)}</p>
                  <select value={d.stage} onChange={(e) => moveDeal(d.id, e.target.value)} className="mt-1 w-full text-[10px] bg-surface border border-border rounded px-1 py-0.5">
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
