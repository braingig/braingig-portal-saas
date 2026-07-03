import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import { formatCents, formatDate } from "@/lib/format";
import { toast } from "sonner";

type PayrollRun = { id: string; period_start: string; period_end: string; status: string; total_cents: number };

export const Route = createFileRoute("/_authenticated/payroll")({
  head: () => ({ meta: [{ title: "Payroll · WorkPilot" }] }),
  component: PayrollPage,
});

function PayrollPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const { hasAny } = useRoles();
  const canManage = hasAny("owner", "admin", "hr");
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [form, setForm] = useState({ period_start: "", period_end: "" });

  async function load() {
    if (!orgId) return;
    const { data } = await supabase.from("payroll_runs").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    setRuns((data ?? []) as PayrollRun[]);
  }

  useEffect(() => { load(); }, [orgId]);

  async function createRun(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !orgId || !canManage) return;
    const { data: run, error } = await supabase.from("payroll_runs").insert({
      organization_id: orgId, period_start: form.period_start, period_end: form.period_end, created_by: user.id,
    }).select().single();
    if (error || !run) { toast.error(error?.message ?? "Failed"); return; }

    const { data: employees } = await supabase.from("employees").select("id, salary_cents").eq("organization_id", orgId).eq("status", "active");
    let total = 0;
    for (const emp of employees ?? []) {
      const gross = emp.salary_cents ?? 0;
      const monthly = Math.round(gross / 12);
      const deductions = Math.round(monthly * 0.2);
      const net = monthly - deductions;
      total += net;
      await supabase.from("payroll_items").insert({
        payroll_run_id: run.id, employee_id: emp.id,
        gross_cents: monthly, deductions_cents: deductions, net_cents: net,
      });
    }
    await supabase.from("payroll_runs").update({ total_cents: total }).eq("id", run.id);
    setForm({ period_start: "", period_end: "" });
    load();
  }

  async function markPaid(id: string) {
    await supabase.from("payroll_runs").update({ status: "paid", processed_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  if (!orgId) return <AppShell title="Payroll"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;
  if (!canManage) return <AppShell title="Payroll"><p className="text-sm text-muted-foreground">HR access required.</p></AppShell>;

  return (
    <AppShell title="Payroll" subtitle={`${runs.length} payroll runs`}>
      <form onSubmit={createRun} className="mb-6 rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3">
        <input required type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <input required type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand text-brand-foreground text-sm font-semibold"><Plus className="size-3.5" /> New payroll run</button>
      </form>
      <div className="space-y-3">
        {runs.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{formatDate(r.period_start)} – {formatDate(r.period_end)}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatCents(r.total_cents)} total</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{r.status}</span>
              {r.status === "draft" && (
                <button onClick={() => markPaid(r.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-surface-2"><Play className="size-3" /> Mark paid</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
