import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PermissionBadges } from "@/components/users/permission-badges";
import { ROLE_LABEL } from "@/lib/users/permissions";
import { logAudit } from "@/lib/audit";
import {
  ALL_PERMISSIONS,
  hasCustomPermissions,
  PERMISSION_LABELS,
  resolveMemberPermissions,
  type Permission,
} from "@/lib/users/permissions";
import { updateMemberPermissions, type OrgMember } from "@/lib/users/directory";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MemberPermissionsEditorProps = {
  orgId: string;
  member: OrgMember;
  disabled?: boolean;
  onSaved: () => void;
};

export function MemberPermissionsEditor({
  orgId,
  member,
  disabled,
  onSaved,
}: MemberPermissionsEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effective = resolveMemberPermissions(member.role, member.customPermissions);
  const [draft, setDraft] = useState<Set<Permission>>(new Set(effective));
  const custom = hasCustomPermissions(member.customPermissions);

  useEffect(() => {
    if (open) {
      setDraft(new Set(resolveMemberPermissions(member.role, member.customPermissions)));
    }
  }, [open, member.role, member.customPermissions]);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function handleOpen() {
    if (disabled) return;
    clearCloseTimer();
    setOpen(true);
  }

  function handleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  function togglePermission(permission: Permission) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  async function save() {
    if (draft.size === 0) {
      toast.error("At least one permission is required");
      return;
    }
    setSaving(true);
    try {
      const roleDefaults = new Set(resolveMemberPermissions(member.role, null));
      const isRoleDefault =
        draft.size === roleDefaults.size
        && ALL_PERMISSIONS.every((p) => draft.has(p) === roleDefaults.has(p));

      const permissions = isRoleDefault ? null : Array.from(draft);
      await updateMemberPermissions(orgId, member.userId, permissions);
      await logAudit("permissions.updated", "user", member.userId, {
        permissions: permissions ?? "role_default",
      });
      toast.success(`Permissions updated for ${member.fullName ?? "member"}`);
      setOpen(false);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  }

  async function resetToRoleDefaults() {
    setSaving(true);
    try {
      await updateMemberPermissions(orgId, member.userId, null);
      await logAudit("permissions.reset", "user", member.userId, { role: member.role });
      toast.success("Permissions reset to role defaults");
      setOpen(false);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset permissions");
    } finally {
      setSaving(false);
    }
  }

  if (disabled) {
    return <PermissionBadges permissions={effective} />;
  }

  return (
    <div
      className="w-fit max-w-full"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-fit max-w-full cursor-pointer rounded-md text-left transition-opacity hover:opacity-80",
              custom && "ring-1 ring-brand/20 ring-offset-1",
            )}
          >
            <PermissionBadges permissions={effective} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-0"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-foreground">Permissions</p>
            <p className="text-[10px] text-muted-foreground">
              Click badges to toggle. Based on {ROLE_LABEL[member.role]} defaults.
            </p>
          </div>
          <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto p-2">
            {ALL_PERMISSIONS.map((permission) => {
              const checked = draft.has(permission);
              return (
                <button
                  key={permission}
                  type="button"
                  onClick={() => togglePermission(permission)}
                  className={cn(
                    "inline-flex cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                    checked
                      ? "border-brand/30 bg-brand/10 text-brand"
                      : "border-border bg-surface text-muted-foreground hover:border-brand/20",
                  )}
                >
                  {PERMISSION_LABELS[permission]}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <button
              type="button"
              onClick={resetToRoleDefaults}
              disabled={saving || !custom}
              className="cursor-pointer text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to role
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="cursor-pointer rounded-md bg-brand px-3 py-1.5 text-[10px] font-semibold text-brand-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
