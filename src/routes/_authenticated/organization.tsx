import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { useRoles } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import { mergeOrgEmailSettings, parseOrgEmailSettings } from "@/lib/email/org-settings";
import { sendTestEmailFn } from "@/lib/email/notifications";
import type { OrgSmtpSettings } from "@/lib/email/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/organization")({
  head: () => ({ meta: [{ title: "Organization · WorkPilot" }] }),
  component: OrganizationPage,
});

const EMPTY_SMTP: OrgSmtpSettings = {
  enabled: false,
  host: "",
  port: 587,
  user: "",
  pass: "",
  from: "",
  secure: false,
};

function OrganizationPage() {
  const { org, orgId, refresh } = useOrganization();
  const { user } = useAuth();
  const { hasAny } = useRoles();
  const canEdit = hasAny("owner", "admin");
  const [form, setForm] = useState({ name: "", website: "", timezone: "UTC", logo_url: "" });
  const [notificationEmail, setNotificationEmail] = useState("");
  const [smtp, setSmtp] = useState<OrgSmtpSettings>(EMPTY_SMTP);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (org) {
      setForm({ name: org.name, website: "", timezone: org.timezone, logo_url: org.logo_url ?? "" });
    }
  }, [org]);

  useEffect(() => {
    if (!orgId) return;
    setLoadingSettings(true);
    supabase
      .from("organizations")
      .select("settings, website")
      .eq("id", orgId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          return;
        }
        const emailSettings = parseOrgEmailSettings(data?.settings);
        setNotificationEmail(emailSettings.notification_email ?? "");
        setSmtp({
          ...EMPTY_SMTP,
          ...emailSettings.smtp,
          pass: "",
        });
        if (data?.website) {
          setForm((current) => ({ ...current, website: data.website ?? "" }));
        }
      })
      .finally(() => setLoadingSettings(false));
  }, [orgId]);

  useEffect(() => {
    if (user?.email && !testEmail) setTestEmail(user.email);
  }, [user?.email, testEmail]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !canEdit) return;

    const { data: current } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    const settings = mergeOrgEmailSettings(current?.settings, {
      notification_email: notificationEmail.trim() || undefined,
      smtp: smtp.enabled
        ? {
            enabled: true,
            host: smtp.host?.trim(),
            port: Number(smtp.port) || 587,
            user: smtp.user?.trim(),
            pass: smtp.pass?.trim() || parseOrgEmailSettings(current?.settings).smtp?.pass,
            from: smtp.from?.trim() || smtp.user?.trim(),
            secure: smtp.secure,
          }
        : {
            ...parseOrgEmailSettings(current?.settings).smtp,
            enabled: false,
          },
    });

    const { error } = await supabase.from("organizations").update({
      name: form.name.trim(),
      website: form.website || null,
      timezone: form.timezone,
      logo_url: form.logo_url || null,
      settings,
    }).eq("id", orgId);

    if (error) { toast.error(error.message); return; }
    await logAudit("organization.updated", "organization", orgId);
    toast.success("Organization updated");
    refresh();
  }

  async function sendTest() {
    if (!orgId || !testEmail.trim()) return;
    setTesting(true);
    try {
      await sendTestEmailFn({ data: { orgId, toEmail: testEmail.trim() } });
      toast.success(`Test email sent to ${testEmail.trim()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setTesting(false);
    }
  }

  if (!orgId) return <AppShell title="Organization"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title="Organization" subtitle="Agency profile, branding, and email notifications">
      {canEdit ? (
        <form onSubmit={save} className="max-w-lg space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold">Profile</h2>
            <label className="block">
              <span className="text-xs text-muted-foreground">Agency name</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Website</span>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Timezone</span>
              <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Logo URL</span>
              <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <p className="text-xs text-muted-foreground">Slug: <code className="font-mono">{org?.slug}</code></p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Email notifications</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Configure where join alerts are sent and optionally use your own SMTP server.
              </p>
            </div>

            {loadingSettings ? (
              <p className="text-sm text-muted-foreground">Loading email settings…</p>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Workspace notification email</span>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="admin@your-agency.com"
                    className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Receives an email when someone joins this workspace. Falls back to owner/admin emails if empty.
                  </span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(smtp.enabled)}
                    onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
                    className="rounded border-border"
                  />
                  Use custom SMTP for this workspace
                </label>

                {smtp.enabled && (
                  <div className="space-y-3 pl-1 border-l-2 border-border ml-1 pl-4">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">SMTP host</span>
                      <input value={smtp.host ?? ""} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.example.com" className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">SMTP port</span>
                      <input type="number" value={smtp.port ?? 587} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">SMTP user</span>
                      <input value={smtp.user ?? ""} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">SMTP password</span>
                      <input type="password" value={smtp.pass ?? ""} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">From address</span>
                      <input value={smtp.from ?? ""} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} placeholder="noreply@your-agency.com" className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(smtp.secure)} onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })} className="rounded border-border" />
                      Use SSL/TLS (port 465)
                    </label>
                  </div>
                )}

                <div className="flex gap-2 items-end pt-2">
                  <label className="block flex-1">
                    <span className="text-xs text-muted-foreground">Send test email to</span>
                    <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="mt-1.5 w-full bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                  </label>
                  <button type="button" onClick={sendTest} disabled={testing} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-surface disabled:opacity-50">
                    {testing ? "Sending…" : "Test"}
                  </button>
                </div>
              </>
            )}
          </section>

          <button type="submit" className="px-4 py-2 rounded-md bg-brand text-brand-foreground text-sm font-semibold">Save</button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Only owners and admins can edit organization settings.</p>
      )}
    </AppShell>
  );
}
