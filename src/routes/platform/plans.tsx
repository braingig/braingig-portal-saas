import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Plan = {
  id: string; name: string; slug: string; description: string | null;
  price_monthly_cents: number; price_yearly_cents: number; max_seats: number;
  features: string[]; is_active: boolean;
};

export const Route = createFileRoute("/platform/plans")({
  head: () => ({ meta: [{ title: "Plans · Platform" }] }),
  component: PlatformPlans,
});

function formatCents(c: number) {
  return `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function PlatformPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase.from("subscription_plans").select("*").order("sort_order")
      .then(({ data }) => setPlans((data ?? []).map((p) => ({ ...p, features: p.features as string[] }))));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Stripe price IDs can be configured per plan in the database.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-6">
            <p className="font-semibold text-lg">{p.name}</p>
            <p className="text-2xl font-bold mt-2">{formatCents(p.price_monthly_cents)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground">{formatCents(p.price_yearly_cents)}/yr · up to {p.max_seats} seats</p>
            <p className="text-sm text-muted-foreground mt-3">{p.description}</p>
            <ul className="mt-4 space-y-1">
              {p.features.map((f) => <li key={f} className="text-xs text-muted-foreground">• {f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
