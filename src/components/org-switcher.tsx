import { useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  dsBody,
  dsCaption,
  dsDropdownItem,
  dsNavGroup,
  dsSelectChevron,
  dsSidebarMeta,
  dsSidebarTitle,
} from "@/lib/design-system";
import { useOrganization } from "@/hooks/use-organization";
import { ROLE_LABEL } from "@/hooks/use-role";
import { useRoles } from "@/hooks/use-role";

export function OrgSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { org, memberships, orgId, switchOrg } = useOrganization();
  const { primary } = useRoles();
  const [open, setOpen] = useState(false);

  if (!org) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-sidebar-accent/60",
          collapsed && "justify-center",
        )}
      >
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-brand to-brand/60 text-sm font-bold text-brand-foreground">
          {org.name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className={dsSidebarTitle}>{org.name}</p>
              <p className={dsSidebarMeta}>{ROLE_LABEL[primary]} workspace</p>
            </div>
            <ChevronDown
              className={cn(dsSelectChevron, "transition-transform", open && "rotate-180")}
              strokeWidth={1.75}
            />
          </>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-1 shadow-lg">
            <p className={cn(dsNavGroup, "px-2 py-1.5")}>Workspaces</p>
            {memberships.map((m) => (
              <button
                key={m.organization_id}
                onClick={() => { switchOrg(m.organization_id); setOpen(false); }}
                className={cn(dsDropdownItem, "w-full rounded-md")}
              >
                <div className="grid size-7 shrink-0 place-items-center rounded-md bg-brand/20 text-xs font-bold text-brand">
                  {m.organization.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className={cn(dsBody, "truncate font-medium")}>{m.organization.name}</p>
                  <p className={dsCaption}>{ROLE_LABEL[m.role]}</p>
                </div>
                {m.organization_id === orgId && <Check className="size-4 shrink-0 text-brand" />}
              </button>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <Link
                to="/onboarding"
                onClick={() => setOpen(false)}
                className={cn(dsDropdownItem, "rounded-md")}
              >
                <Plus className="size-4" /> Create or join workspace
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
