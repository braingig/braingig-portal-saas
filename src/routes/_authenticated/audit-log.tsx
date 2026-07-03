import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldOff, ScrollText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-role";
import { useOrganization } from "@/hooks/use-organization";

type Log = {
  id: string; actor_id: string | null; action: string;
  entity_type: string; entity_id: string | null;
  metadata: Record<string, unknown>; created_at: string;
};

export const Route = createFileRoute("/_authenticated/audit-log")({
  head: () => ({ meta: [{ title: "Audit Log · WorkPilot" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { hasAny, loading: rl } = useRoles();
  const { orgId } = useOrganization();
  const allowed = hasAny("owner", "admin");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!allowed || !orgId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("audit_logs").select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }).limit(200);
      setLogs((data ?? []) as Log[]);
      const actorIds = [...new Set((data ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
      if (actorIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
        const m: Record<string, string> = {};
        (profs ?? []).forEach((p) => { m[p.id] = p.full_name ?? p.id.slice(0,8); });
        setNames(m);
      }
      setLoading(false);
    })();
  }, [allowed, orgId]);

  if (rl || loading) return <AppShell title="Audit Log"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;
  if (!allowed) {
    return (
      <AppShell title="Audit Log">
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <ShieldOff className="size-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Access restricted</p>
          <p className="text-sm text-muted-foreground mt-1">Only Owners and Admins can view the audit log.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Audit Log" subtitle={`${logs.length} most recent events`}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center">
            <ScrollText className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No events yet. Activity will appear here.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[160px_140px_1fr_160px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <div>Time</div><div>Actor</div><div>Action</div><div>Entity</div>
            </div>
            {logs.map((l) => (
              <div key={l.id} className="grid grid-cols-[160px_140px_1fr_160px] gap-3 px-4 py-2.5 items-center border-b border-border last:border-0 text-sm">
                <div className="text-xs text-muted-foreground font-mono">{new Date(l.created_at).toLocaleString()}</div>
                <div className="text-xs truncate">{l.actor_id ? (names[l.actor_id] ?? l.actor_id.slice(0,8)) : "system"}</div>
                <div className="text-xs"><span className="font-mono text-brand">{l.action}</span></div>
                <div className="text-xs text-muted-foreground truncate">{l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(0,8)}` : ""}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}
