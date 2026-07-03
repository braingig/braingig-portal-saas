import { PERMISSION_LABELS, type Permission } from "@/lib/users/permissions";
import { cn } from "@/lib/utils";

type PermissionBadgesProps = {
  permissions: Permission[];
  max?: number;
  className?: string;
};

export function PermissionBadges({ permissions, max = 3, className }: PermissionBadgesProps) {
  const visible = permissions.slice(0, max);
  const overflow = Math.max(0, permissions.length - max);

  return (
    <div className={cn("flex max-w-full flex-wrap gap-1.5", className)}>
      {visible.map((permission) => (
        <span
          key={permission}
          className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand"
        >
          {PERMISSION_LABELS[permission]}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}
