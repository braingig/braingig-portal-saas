import { X } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { FormField } from "@/components/ui/form-field";
import type { TaskOrgMember } from "@/lib/tasks/types";

type TaskAssigneesFieldProps = {
  id: string;
  members: TaskOrgMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function TaskAssigneesField({
  id,
  members,
  selectedIds,
  onChange,
}: TaskAssigneesFieldProps) {
  const selected = members.filter((m) => selectedIds.includes(m.id));
  const available = members.filter((m) => !selectedIds.includes(m.id));

  function addAssignee(userId: string) {
    if (!userId || selectedIds.includes(userId)) return;
    onChange([...selectedIds, userId]);
  }

  function removeAssignee(userId: string) {
    onChange(selectedIds.filter((id) => id !== userId));
  }

  return (
    <FormField label="Assignees" htmlFor={id}>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {selected.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <ProfileAvatar
                  userId={member.id}
                  name={member.full_name}
                  avatarUrl={member.avatar_url}
                  email={member.email}
                  size="sm"
                />
                <span className="truncate text-sm font-medium">{member.full_name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAssignee(member.id)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={`Remove ${member.full_name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <select
        id={id}
        value=""
        onChange={(e) => addAssignee(e.target.value)}
        disabled={available.length === 0}
        className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          {members.length === 0
            ? "No team members found"
            : available.length === 0
              ? "All members assigned"
              : "Select assignees"}
        </option>
        {available.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name}
          </option>
        ))}
      </select>
    </FormField>
  );
}
