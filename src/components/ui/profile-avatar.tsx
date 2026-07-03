import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  avatarInitialsTone,
  buildAvatarSources,
  profileInitials,
  type ProfileAvatarInput,
} from "@/lib/avatars";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  xs: "size-6",
  sm: "size-7",
  md: "size-8",
  lg: "size-10",
  xl: "size-12",
} as const;

const TEXT_CLASS = {
  xs: "text-[9px]",
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-xs",
  xl: "text-sm",
} as const;

const PIXEL_SIZE = {
  xs: 48,
  sm: 56,
  md: 64,
  lg: 80,
  xl: 96,
} as const;

export type ProfileAvatarProps = Omit<ProfileAvatarInput, "size"> & {
  name?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
};

function InitialsAvatar({
  userId,
  name,
  email,
  size,
  className,
}: {
  userId: string;
  name?: string | null;
  email?: string | null;
  size: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const initials = profileInitials(name, email, userId);
  const tone = avatarInitialsTone(userId);

  return (
    <div
      aria-hidden
      className={cn(
        SIZE_CLASS[size],
        "grid shrink-0 place-items-center rounded-full border border-border font-semibold uppercase",
        TEXT_CLASS[size],
        tone,
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function ProfileAvatar({
  userId,
  avatarUrl,
  email,
  name,
  size = "md",
  className,
  imageClassName,
  eager = false,
}: ProfileAvatarProps) {
  const imageSources = useMemo(
    () => buildAvatarSources({
      userId,
      avatarUrl,
      email,
      name,
      size: PIXEL_SIZE[size],
    }),
    [userId, avatarUrl, email, name, size],
  );

  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [userId, avatarUrl, email, name]);

  const activeSource = imageSources[sourceIndex];
  const showInitials = !activeSource;

  if (showInitials) {
    return (
      <InitialsAvatar
        userId={userId}
        name={name}
        email={email}
        size={size}
        className={className}
      />
    );
  }

  const initials = profileInitials(name, email, userId);
  const tone = avatarInitialsTone(userId);

  function advanceSource() {
    setSourceIndex((current) => current + 1);
  }

  return (
    <Avatar className={cn(SIZE_CLASS[size], "border border-border bg-surface", className)}>
      <AvatarImage
        src={activeSource.url}
        alt={name ? `${name} avatar` : ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cn("object-cover", imageClassName)}
        onLoadingStatusChange={(status) => {
          if (status === "error") advanceSource();
        }}
      />
      <AvatarFallback
        delayMs={0}
        className={cn("font-semibold uppercase", TEXT_CLASS[size], tone)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
