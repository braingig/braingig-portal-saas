import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CheckCircle2, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkPilot — The unified operating system for modern teams" },
      { name: "description", content: "Projects, time tracking, HR, payroll, CRM, recruitment, docs and chat — one premium platform." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center size-8 rounded-md bg-gradient-to-br from-brand to-brand/60 text-brand-foreground font-bold text-sm">W</div>
            <span className="font-semibold tracking-tight">WorkPilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#customers" className="hover:text-foreground transition-colors">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Sign in</Link>
            <Link to="/dashboard" className="text-sm font-medium px-4 py-1.5 rounded-md bg-brand text-brand-foreground hover:brightness-110 transition-all">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_25%,transparent),transparent)]" />
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs text-muted-foreground animate-reveal">
            <Sparkles className="size-3 text-brand" /> Built for high-velocity agencies & teams
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight text-balance animate-reveal">
            One platform.<br />
            <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Every part of your business.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground text-balance animate-reveal">
            Projects, time, HR, payroll, CRM, recruitment, docs and messaging — finally unified, beautifully designed, ruthlessly fast.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 animate-reveal">
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand text-brand-foreground font-semibold hover:brightness-110 transition-all shadow-[0_8px_32px_-8px_var(--brand)]">
              Launch WorkPilot <ArrowRight className="size-4" />
            </Link>
            <a href="#features" className="px-5 py-2.5 rounded-md border border-border hover:bg-surface text-sm font-medium">
              See it in action
            </a>
          </div>

          {/* Preview frame */}
          <div className="mt-16 mx-auto max-w-6xl rounded-2xl border border-border bg-surface p-2 shadow-[0_40px_80px_-20px_oklch(0_0_0/0.6)] animate-reveal">
            <div className="rounded-xl bg-background border border-border overflow-hidden aspect-[16/9] grid place-items-center">
              <div className="text-center space-y-3">
                <BarChart3 className="size-12 text-brand mx-auto" />
                <p className="text-muted-foreground text-sm">Live executive dashboard preview</p>
                <Link to="/dashboard" className="inline-flex items-center gap-1 text-brand text-sm font-medium">
                  Explore the app <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "Built for speed", body: "Command palette, keyboard-first, sub-100ms everything." },
          { icon: BarChart3, title: "Decisions backed by data", body: "Real-time analytics across projects, sales, HR and finance." },
          { icon: CheckCircle2, title: "Enterprise-grade", body: "SSO, audit logs, granular RBAC, multi-org, white labeling." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-brand/30 transition-colors">
            <f.icon className="size-5 text-brand" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground">
        © 2026 WorkPilot · Built for teams that ship.
      </footer>
    </div>
  );
}
