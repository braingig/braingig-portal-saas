import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Calendar, Users, UserCircle,
  Clock, CalendarOff, Wallet, UserPlus, Briefcase, BarChart3, FileText,
  Folder, MessageSquare, Settings, CreditCard, Building2, Search, Plus,
  Command, Play, ChevronsLeft, ChevronsRight, LogOut,
  Shield, ScrollText, Inbox,
} from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { cn } from "@/lib/utils";
import {
  dsBody,
  dsButtonPrimary,
  dsCaption,
  dsDropdownItem,
  dsNavGroup,
  dsNavLink,
  dsNavLinkActive,
  dsNavLinkInactive,
  dsPageSubtitle,
  dsPageTitle,
  dsSidebarMeta,
} from "@/lib/design-system";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useRoles, ROLE_LABEL, type Permission } from "@/hooks/use-role";
import { NotificationsBell } from "@/components/notifications-bell";
import { OrgSwitcher } from "@/components/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalChat } from "@/components/global-chat";
import { useOrganization } from "@/hooks/use-organization";

import { usePlatformAdmin } from "@/hooks/use-platform-admin";

type NavItem = { label: string; to: string; icon: typeof LayoutDashboard; perm: Permission };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, perm: "dashboard" },
      { label: "My Tasks", to: "/my-tasks", icon: Inbox, perm: "my_tasks" },
      { label: "Projects", to: "/projects", icon: FolderKanban, perm: "projects" },
      { label: "Tasks", to: "/tasks", icon: CheckSquare, perm: "tasks" },
      { label: "Calendar", to: "/calendar", icon: Calendar, perm: "calendar" },
      { label: "Team", to: "/team", icon: Users, perm: "team" },
      { label: "Employees", to: "/employees", icon: UserCircle, perm: "employees" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Attendance", to: "/attendance", icon: Clock, perm: "attendance" },
      { label: "Leave", to: "/leave", icon: CalendarOff, perm: "leave" },
      { label: "Payroll", to: "/payroll", icon: Wallet, perm: "payroll" },
      { label: "Recruitment", to: "/recruitment", icon: UserPlus, perm: "recruitment" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Sales CRM", to: "/crm", icon: Briefcase, perm: "crm" },
      { label: "Reports", to: "/reports", icon: BarChart3, perm: "reports" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { label: "Docs", to: "/docs", icon: FileText, perm: "docs" },
      { label: "Files", to: "/files", icon: Folder, perm: "files" },
      { label: "Messages", to: "/messages", icon: MessageSquare, perm: "messages" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "User Management", to: "/users", icon: Shield, perm: "users" },
      { label: "Audit Log", to: "/audit-log", icon: ScrollText, perm: "audit" },
      { label: "Settings", to: "/settings", icon: Settings, perm: "settings" },
      { label: "Billing", to: "/billing", icon: CreditCard, perm: "billing" },
      { label: "Organization", to: "/organization", icon: Building2, perm: "organization" },
    ],
  },
];

export function AppShell({ children, title, subtitle, actions, titleClassName, subtitleClassName }: {
  children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode;
  titleClassName?: string; subtitleClassName?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();
  const { org, orgId } = useOrganization();
  const { can, primary, loading: rolesLoading } = useRoles();
  const { isPlatformAdmin } = usePlatformAdmin();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "You";

  const visibleNav = NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => can(it.perm)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 shrink-0",
          collapsed ? "w-[68px]" : "w-[252px]"
        )}
      >
        <div className="px-3 h-14 border-b border-sidebar-border flex items-center">
          {org ? <OrgSwitcher collapsed={collapsed} /> : (
            <div className="grid place-items-center size-8 rounded-md bg-gradient-to-br from-brand to-brand/60 text-brand-foreground font-bold text-sm">W</div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
          {rolesLoading && !collapsed && (
            <p className={cn("px-2", dsCaption)}>Loading…</p>
          )}
          {visibleNav.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className={cn("px-2 mb-1", dsNavGroup)}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((it) => {
                  const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={cn(
                        dsNavLink,
                        active ? dsNavLinkActive : dsNavLinkInactive,
                        collapsed && "justify-center px-2",
                      )}
                      title={collapsed ? it.label : undefined}
                    >
                      <Icon className={cn("size-4 shrink-0", active && "text-brand")} />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(dsNavLink, dsNavLinkInactive, "w-full")}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-5 gap-4 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xl">
            <button className={cn("flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 transition-colors hover:border-border/80", dsBody, "text-muted-foreground")}>
              <Search className="size-4 shrink-0" />
              <span className="truncate">Search projects, tasks, people…</span>
              <span className={cn("ml-auto flex items-center gap-1 font-mono", dsCaption)}>
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-border">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-border">K</kbd>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="grid place-items-center size-9 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors">
              <Command className="size-4" />
            </button>
            <GlobalChat />
            <NotificationsBell />
            <ThemeToggle />
            <button className={dsButtonPrimary}>
              <Plus className="size-3.5" /> Create
            </button>
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full hover:brightness-110"
              >
                <ProfileAvatar
                  userId={user?.id ?? "guest"}
                  name={displayName}
                  avatarUrl={profile?.avatar_url}
                  email={user?.email}
                  size="md"
                  className="size-8"
                  eager
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-56 rounded-lg border border-border bg-popover shadow-lg p-1 z-30">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className={cn(dsBody, "font-medium truncate")}>{displayName}</p>
                    <p className={cn(dsCaption, "truncate")}>{user?.email}</p>
                    <p className={cn(dsSidebarMeta, "mt-1 text-brand")}>{ROLE_LABEL[primary]}</p>
                  </div>
                  <Link to="/settings" onClick={() => setMenuOpen(false)} className={cn(dsDropdownItem, "rounded-md mx-0")}>
                    <Settings className="size-3.5" /> Settings
                  </Link>
                  {isPlatformAdmin && (
                    <Link to="/platform" onClick={() => setMenuOpen(false)} className={cn(dsDropdownItem, "rounded-md mx-0 text-violet-500")}>
                      <Shield className="size-3.5" /> Platform admin
                    </Link>
                  )}
                  <button onClick={signOut} className={cn(dsDropdownItem, "w-full rounded-md text-left")}>
                    <LogOut className="size-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {(title || actions) && (
            <div className="px-8 pt-8 pb-6 flex items-end justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                {title && <h1 className={cn(dsPageTitle, titleClassName)}>{title}</h1>}
                {subtitle && <p className={cn(dsPageSubtitle, "mt-1", subtitleClassName)}>{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          <div className="px-8 pb-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
