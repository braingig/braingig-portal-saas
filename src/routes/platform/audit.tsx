import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/platform/audit")({
  head: () => ({ meta: [{ title: "Platform audit · WorkPilot" }] }),
  component: PlatformAudit,
});

function PlatformAudit() {
  const [logs, setLogs] = useState<Array<{ id: string; action: string; entity_type: string; created_at: string; metadata: Record<string, unknown> }>>([]);

  useEffect(() => {
    supabase.from("audit_logs").select("*").is("organization_id", null).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setLogs((data ?? []) as typeof logs));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform audit log</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground text-center">No platform-level events yet.</p>
        ) : logs.map((l) => (
          <div key={l.id} className="px-4 py-3 border-b border-border last:border-0 text-sm">
            <span className="font-medium">{l.action}</span>
            <span className="text-muted-foreground ml-2">{l.entity_type}</span>
            <span className="text-[10px] text-muted-foreground ml-auto float-right">{new Date(l.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
