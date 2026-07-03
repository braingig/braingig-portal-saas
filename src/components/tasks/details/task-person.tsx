import { ProfileAvatar } from "@/components/ui/profile-avatar";
import type { TaskDetailProfile } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPersonProps = {
  profile: TaskDetailProfile;
  subtitle?: string | null;
  size?: "sm" | "md";
  showYou?: boolean;
  currentUserId?: string;
  className?: string;
  eager?: boolean;
};

export function TaskPerson({
  profile,
  subtitle,
  size = "md",
  showYou,
  currentUserId,
  className,
  eager,
}: TaskPersonProps) {
  const isYou = showYou && currentUserId === profile.id;
  const secondary = subtitle ?? profile.job_title;

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <ProfileAvatar
        userId={profile.id}
        name={profile.full_name}
        avatarUrl={profile.avatar_url}
        email={profile.email}
        size={size === "sm" ? "sm" : "md"}
        eager={eager}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {profile.full_name}
          {isYou && <span className="text-muted-foreground"> (you)</span>}
        </p>
        {secondary && (
          <p className="truncate text-xs text-muted-foreground">{secondary}</p>
        )}
      </div>
    </div>
  );
}
