import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Hash, Plus, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

type Channel = { id: string; name: string; description: string | null };
type Message = { id: string; content: string; user_id: string; created_at: string; author?: string };

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages · WorkPilot" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orgId) return;
    supabase.from("channels").select("*").eq("organization_id", orgId).order("name")
      .then(({ data }) => {
        const list = (data ?? []) as Channel[];
        setChannels(list);
        if (list.length && !active) setActive(list[0]);
      });
  }, [orgId]);

  async function loadMessages(channelId: string) {
    const { data } = await supabase.from("messages").select("*").eq("channel_id", channelId).order("created_at").limit(100);
    const msgs = (data ?? []) as Message[];
    const ids = [...new Set(msgs.map((m) => m.user_id))];
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
    const names = new Map((profs ?? []).map((p) => [p.id, p.full_name ?? "Member"]));
    setMessages(msgs.map((m) => ({ ...m, author: names.get(m.user_id) })));
  }

  useEffect(() => {
    if (!active) return;
    loadMessages(active.id);
    const ch = supabase.channel("msgs:" + active.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${active.id}` }, () => loadMessages(active.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!body.trim() || !user || !active || !orgId) return;
    await supabase.from("messages").insert({
      channel_id: active.id, user_id: user.id, content: body.trim(), organization_id: orgId,
    });
    setBody("");
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !orgId || !newChannel.trim()) return;
    const name = newChannel.trim().toLowerCase().replace(/\s+/g, "-");
    await supabase.from("channels").insert({ name, organization_id: orgId, created_by: user.id });
    setNewChannel("");
    const { data } = await supabase.from("channels").select("*").eq("organization_id", orgId).order("name");
    setChannels((data ?? []) as Channel[]);
  }

  if (!orgId) return <AppShell title="Messages"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Messages">
      <div className="flex h-[calc(100vh-12rem)] rounded-xl border border-border bg-card overflow-hidden">
        <aside className="w-56 border-r border-border flex flex-col">
          <form onSubmit={createChannel} className="p-2 border-b border-border flex gap-1">
            <input value={newChannel} onChange={(e) => setNewChannel(e.target.value)} placeholder="New channel" className="flex-1 text-xs bg-surface border border-border rounded px-2 py-1.5" />
            <button type="submit" className="p-1.5 rounded bg-brand text-brand-foreground"><Plus className="size-3.5" /></button>
          </form>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {channels.map((c) => (
              <button key={c.id} onClick={() => setActive(c)} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left ${active?.id === c.id ? "bg-surface-2" : "hover:bg-surface-2/60"}`}>
                <Hash className="size-3.5 text-muted-foreground" />{c.name}
              </button>
            ))}
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          {active ? (
            <>
              <div className="px-4 py-3 border-b border-border font-semibold text-sm">#{active.name}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={m.user_id === user?.id ? "text-right" : ""}>
                    <p className="text-[10px] text-muted-foreground">{m.author} · {new Date(m.created_at).toLocaleTimeString()}</p>
                    <p className={`inline-block mt-0.5 px-3 py-1.5 rounded-lg text-sm ${m.user_id === user?.id ? "bg-brand text-brand-foreground" : "bg-surface-2"}`}>{m.content}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message…" className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                <button onClick={send} className="px-3 rounded-md bg-brand text-brand-foreground"><Send className="size-4" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select or create a channel</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
