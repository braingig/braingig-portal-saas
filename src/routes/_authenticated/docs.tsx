import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

type Doc = { id: string; title: string; content: string; updated_at: string };

export const Route = createFileRoute("/_authenticated/docs")({
  head: () => ({ meta: [{ title: "Documentation · WorkPilot" }] }),
  component: DocsPage,
});

function DocsPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [active, setActive] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    if (!orgId) return;
    const { data } = await supabase.from("documents").select("id, title, content, updated_at").eq("organization_id", orgId).order("updated_at", { ascending: false });
    setDocs((data ?? []) as Doc[]);
  }

  useEffect(() => { load(); }, [orgId]);

  async function create() {
    if (!user || !orgId || !title.trim()) return;
    const { data } = await supabase.from("documents").insert({
      organization_id: orgId, title: title.trim(), content, created_by: user.id,
    }).select().single();
    if (data) { setActive(data as Doc); setTitle(""); setContent(""); load(); }
  }

  async function save() {
    if (!active || !user) return;
    await supabase.from("documents").update({ title: active.title, content: active.content, updated_by: user.id }).eq("id", active.id);
    load();
  }

  if (!orgId) return <AppShell title="Documentation"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Documentation" subtitle={`${docs.length} pages`}>
      <div className="flex h-[calc(100vh-12rem)] rounded-xl border border-border bg-card overflow-hidden">
        <aside className="w-56 border-r border-border p-3 flex flex-col">
          <div className="flex gap-1 mb-3">
            <input placeholder="New page" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 text-xs bg-surface border border-border rounded px-2 py-1.5" />
            <button onClick={create} className="p-1.5 rounded bg-brand text-brand-foreground"><Plus className="size-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {docs.map((d) => (
              <button key={d.id} onClick={() => setActive(d)} className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left ${active?.id === d.id ? "bg-surface-2" : "hover:bg-surface-2/60"}`}>
                <FileText className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{d.title}</span>
              </button>
            ))}
          </div>
        </aside>
        {active ? (
          <div className="flex-1 flex flex-col p-4">
            <input value={active.title} onChange={(e) => setActive({ ...active, title: e.target.value })} className="text-lg font-semibold bg-transparent border-0 outline-none mb-3" />
            <textarea value={active.content} onChange={(e) => setActive({ ...active, content: e.target.value })} className="flex-1 bg-surface border border-border rounded-lg p-4 text-sm resize-none outline-none" placeholder="Start writing…" />
            <button onClick={save} className="mt-3 self-end px-4 py-2 rounded-md bg-brand text-brand-foreground text-sm font-semibold">Save</button>
          </div>
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select or create a document</div>
        )}
      </div>
    </AppShell>
  );
}
