import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { bootstrapDemoAccounts } from "@/lib/bootstrap-demo";
import { resolvePostAuthPath } from "@/lib/auth-routing";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · WorkPilot" }] }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      navigate({ to: await resolvePostAuthPath(data.session.user.id) });
    });
  }, [navigate]);

  async function navigateAfterAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    navigate({ to: await resolvePostAuthPath(user.id) });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });
        if (error) throw error;
        toast.success("Account created — paste your invite code on the next screen");
        await navigateAfterAuth();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        await navigateAfterAuth();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.toLowerCase().includes("email not confirmed")) {
        toast.error("Email confirmation is enabled in Supabase. Use demo accounts or disable confirmation for local tests.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loginAsDemo(email: string) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
      if (error) throw error;
      toast.success(`Signed in as ${email.split("@")[0]}`);
      await navigateAfterAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Demo login failed";
      if (msg.toLowerCase().includes("invalid login")) {
        toast.error("Demo accounts not seeded yet. Click “Setup demo workspace” first.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function setupDemoWorkspace() {
    setSeeding(true);
    try {
      await bootstrapDemoAccounts();
      toast.success(`Demo workspace ready. Password: ${DEMO_PASSWORD}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Setup failed";
      if (msg.includes("SUPABASE_SERVICE_ROLE_KEY") || msg.includes("Missing Supabase")) {
        toast.error("Add SUPABASE_SERVICE_ROLE_KEY to .env, or run supabase/DEMO_SETUP.sql in Supabase SQL Editor.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSeeding(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
  }

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-surface to-background relative overflow-hidden border-r border-border">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-20 -right-20 size-80 rounded-full bg-brand/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid place-items-center size-8 rounded-md bg-gradient-to-br from-brand to-brand/60 text-brand-foreground font-bold text-sm">W</div>
          <span className="font-semibold tracking-tight">WorkPilot</span>
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold tracking-tight text-balance leading-tight">
            One platform for projects, people and pipeline.
          </h2>
          <p className="text-muted-foreground text-balance max-w-md">
            Replace 8 tools with one premium operating system. Built for high-velocity teams that ship.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
            {[["10k+", "teams"], ["$2B+", "tracked"], ["99.99%", "uptime"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold">{v}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted-foreground">© 2026 WorkPilot</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="grid place-items-center size-8 rounded-md bg-gradient-to-br from-brand to-brand/60 text-brand-foreground font-bold text-sm">W</div>
            <span className="font-semibold">WorkPilot</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Sign in to WorkPilot" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin"
                ? "Welcome back. Have an invite code? Join your workspace after signing in."
                : "Create an account, then paste your invite code on the join screen."}
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-border bg-surface hover:bg-surface-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <Field label="Full name">
                <input
                  required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Marcus Wright" autoComplete="name"
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email"
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              />
            </Field>
            <Field label="Password">
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters" autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              />
            </Field>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-brand text-brand-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <>
                {mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="size-3.5" />
              </>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to WorkPilot? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-foreground font-medium hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

          {mode === "signin" && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Try WorkPilot instantly</p>
                <button
                  type="button"
                  disabled={loading || seeding}
                  onClick={setupDemoWorkspace}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-surface-2 text-[10px] font-medium disabled:opacity-50"
                >
                  {seeding ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  Setup demo workspace
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.filter((a) => !a.platformAdmin).map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={loading || seeding}
                    onClick={() => loginAsDemo(a.email)}
                    className="px-2 py-1.5 rounded-md border border-border hover:bg-surface-2 text-left text-[11px] disabled:opacity-50"
                    title={`${a.fullName} · ${a.description}`}
                  >
                    <span className="block font-medium capitalize">{a.role.replace("_", " ")}</span>
                    <span className="block text-muted-foreground truncate">{a.email}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                All demo accounts use password <code className="text-foreground">{DEMO_PASSWORD}</code>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
}
