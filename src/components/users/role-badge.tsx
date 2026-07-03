import { ROLE_LABEL, type AppRole } from "@/lib/users/permissions";

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span className="inline-flex w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
      {ROLE_LABEL[role]}
    </span>
  );
}
