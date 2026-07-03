import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · WorkPilot" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setJobTitle(profile.job_title ?? "");
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim() || null,
      job_title: jobTitle.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  return (
    <AppShell title="Settings" subtitle="Your account preferences">
      <form onSubmit={save} className="max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold">Profile</h3>
        <label className="block">
          <span className="text-xs text-muted-foreground">Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Job title</span>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Email</span>
          <input value={user?.email ?? ""} disabled className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm opacity-60" />
        </label>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-brand text-brand-foreground text-sm font-semibold disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </AppShell>
  );
}
