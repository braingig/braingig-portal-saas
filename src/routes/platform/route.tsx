import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Building2, LayoutDashboard, CreditCard, Shield, ScrollText, LogOut, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import { usePlatformAdmin } from "@/hooks/use-platform-admin";
import { checkIsPlatformAdmin } from "@/lib/auth-routing";

const NAV = [
  { label: "Overview", to: "/platform", icon: LayoutDashboard },
  { label: "Agencies", to: "/platform/organizations", icon: Building2 },
  { label: "Plans", to: "/platform/plans", icon: CreditCard },
  { label: "Audit", to: "/platform/audit", icon: ScrollText },
  { label: "Admins", to: "/platform/admins", icon: Shield },
];

export const Route = createFileRoute("/platform")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!(await checkIsPlatformAdmin(data.user.id))) throw redirect({ to: "/dashboard" });
    return { user: data.user };
  },
  component: PlatformLayout,
});

function PlatformLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { isPlatformAdmin } = usePlatformAdmin();

  if (!isPlatformAdmin) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className={cn("flex flex-col border-r border-border bg-sidebar shrink-0 transition-[width]", collapsed ? "w-[68px]" : "w-[240px]")}>
        <div className="h-14 px-3 flex items-center gap-2 border-b border-border">
          <div className="size-8 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 text-white grid place-items-center text-xs font-bold">P</div>
          {!collapsed && <span className="text-sm font-semibold">WorkPilot Platform</span>}
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((it) => {
            const active = pathname === it.to || (it.to !== "/platform" && pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                collapsed && "justify-center",
              )}>
                <Icon className={cn("size-4", active && "text-violet-500")} />
                {!collapsed && it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <button onClick={() => setCollapsed((v) => !v)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border px-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Platform administration</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8"><Outlet /></main>
      </div>
    </div>
  );
}
