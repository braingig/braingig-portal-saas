import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppRole } from "@/lib/users/permissions";
import { cn } from "@/lib/utils";

type MemberRoleMenuProps = {
  role: AppRole;
  options: { value: AppRole; label: string }[];
  onChange: (role: AppRole) => void;
  disabled?: boolean;
};

export function MemberRoleMenu({ role, options, onChange, disabled }: MemberRoleMenuProps) {
  if (disabled) {
    return <span className="text-[10px] text-muted-foreground">—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Manage member role"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={option.value === role}
            className={cn("cursor-pointer text-xs", option.value === role && "font-medium text-brand")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
