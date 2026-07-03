import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/platform/admins")({
  head: () => ({ meta: [{ title: "Platform admins · WorkPilot" }] }),
  component: PlatformAdmins,
});

function PlatformAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Array<{ user_id: string; full_name: string | null; email?: string }>>([]);
  const [email, setEmail] = useState("");

  async function load() {
    const { data } = await supabase.from("platform_admins").select("user_id, created_at");
    const ids = (data ?? []).map((a) => a.user_id);
    if (!ids.length) { setAdmins([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    setAdmins((profiles ?? []).map((p) => ({ user_id: p.id, full_name: p.full_name })));
  }

  useEffect(() => { load(); }, []);

  async function addByEmail(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform administrators</h1>
        <p className="text-sm text-muted-foreground mt-1">First registered user is automatically a platform admin.</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {admins.map((a) => (
          <div key={a.user_id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium">{a.full_name ?? "Admin"}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{a.user_id.slice(0, 12)}…</p>
            </div>
            {a.user_id === user?.id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500">You</span>}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Additional platform admins can be added via the Supabase dashboard or service role until invite flow is built.</p>
    </div>
  );
}
