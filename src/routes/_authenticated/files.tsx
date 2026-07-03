import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, File } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

type FileAsset = { id: string; name: string; storage_path: string; size_bytes: number; mime_type: string | null; created_at: string };

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export const Route = createFileRoute("/_authenticated/files")({
  head: () => ({ meta: [{ title: "Files · WorkPilot" }] }),
  component: FilesPage,
});

function FilesPage() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [form, setForm] = useState({ name: "", path: "" });

  async function load() {
    if (!orgId) return;
    const { data } = await supabase.from("file_assets").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    setFiles((data ?? []) as FileAsset[]);
  }

  useEffect(() => { load(); }, [orgId]);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !orgId || !form.name.trim()) return;
    await supabase.from("file_assets").insert({
      organization_id: orgId, name: form.name.trim(),
      storage_path: form.path || `/uploads/${orgId}/${form.name.trim()}`,
      size_bytes: 0, uploaded_by: user.id,
    });
    setForm({ name: "", path: "" });
    load();
  }

  async function remove(id: string) {
    await supabase.from("file_assets").delete().eq("id", id);
    load();
  }

  if (!orgId) return <AppShell title="Files"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Files" subtitle={`${files.length} files`}>
      <p className="text-xs text-muted-foreground mb-4">Register file metadata here. Connect Supabase Storage bucket for uploads in production.</p>
      <form onSubmit={register} className="mb-6 rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3">
        <input required placeholder="File name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="flex-1 min-w-[140px] bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        <input placeholder="Storage path (optional)" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} className="flex-1 min-w-[140px] bg-surface border border-border rounded-md px-3 py-2 text-sm font-mono text-xs" />
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand text-brand-foreground text-sm font-semibold"><Plus className="size-3.5" /> Register file</button>
      </form>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
            <File className="size-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{f.storage_path}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatBytes(f.size_bytes)}</span>
            <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-danger"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
