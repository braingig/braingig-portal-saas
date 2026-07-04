import { ProfileAvatar } from "@/components/ui/profile-avatar";
import type { TaskDetailProfile } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TaskPersonProps = {
  profile: TaskDetailProfile;
  subtitle?: string | null;
  size?: "xs" | "sm" | "md";
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
    <div className={cn("flex min-w-0 items-center", size === "xs" ? "gap-2" : "gap-2.5", className)}>
      <ProfileAvatar
        userId={profile.id}
        name={profile.full_name}
        avatarUrl={profile.avatar_url}
        email={profile.email}
        size={size === "xs" ? "xs" : size === "sm" ? "sm" : "md"}
        eager={eager}
      />
      <div className="min-w-0">
        <p className={cn(
          "truncate text-foreground",
          size === "xs" ? "text-[13px] font-normal" : "text-sm font-medium",
        )}>
          {profile.full_name}
          {isYou && <span className="text-muted-foreground"> (you)</span>}
        </p>
        {secondary && (
          <p className={cn(
            "truncate text-muted-foreground",
            size === "xs" ? "text-[11px]" : "text-xs",
          )}>{secondary}</p>
        )}
      </div>
    </div>
  );
}
