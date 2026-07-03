import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { formatCents, formatDate } from "@/lib/format";
import { toast } from "sonner";

type Plan = { id: string; name: string; slug: string; price_monthly_cents: number; features: string[] };
type Sub = { status: string; seat_count: number; trial_ends_at: string | null; plan_id: string | null };

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing · WorkPilot" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { orgId } = useOrganization();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setPlans((data ?? []).map((p) => ({ ...p, features: p.features as string[] }))));
  }, []);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("organization_subscriptions").select("*").eq("organization_id", orgId).maybeSingle()
      .then(({ data }) => {
        if (data) { setSub(data); setCurrentPlanId(data.plan_id); }
      });
  }, [orgId]);

  function checkout(planId: string) {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      toast.error("Configure VITE_STRIPE_PUBLISHABLE_KEY and Stripe webhook edge function to enable checkout");
      return;
    }
    toast.info("Stripe Checkout session would open here — wire your edge function");
  }

  if (!orgId) return <AppShell title="Billing"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Billing" subtitle={sub ? `${sub.status} · ${sub.seat_count} seats${sub.trial_ends_at ? ` · trial ends ${formatDate(sub.trial_ends_at)}` : ""}` : "No subscription"}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          return (
            <div key={p.id} className={`rounded-xl border p-6 ${isCurrent ? "border-brand bg-card shadow-[0_0_0_1px_var(--brand)]" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.name}</p>
                {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand text-brand-foreground font-semibold">Current</span>}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{formatCents(p.price_monthly_cents)}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="size-3.5 text-success" />{f}</li>
                ))}
              </ul>
              <button onClick={() => checkout(p.id)} disabled={isCurrent} className={`mt-6 w-full py-2 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 ${isCurrent ? "bg-surface-2 text-muted-foreground" : "bg-brand text-brand-foreground"}`}>
                <CreditCard className="size-4" />{isCurrent ? "Current plan" : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
