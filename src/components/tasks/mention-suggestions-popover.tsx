import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { filterMentionMembers } from "@/lib/tasks/comment-mentions";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type PopoverPosition = {
  left: number;
  width: number;
  top: number;
  transform?: string;
  maxHeight: number;
};

type MentionSuggestionsPopoverProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  members: TaskOrgMember[];
  query: string;
  activeIndex: number;
  onSelect: (member: TaskOrgMember) => void;
};

function computePosition(anchor: HTMLElement): PopoverPosition {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(384, Math.max(rect.width, 240));
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
  const gap = 8;
  const estimatedHeight = 220;
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const preferAbove = spaceAbove >= estimatedHeight || spaceAbove > spaceBelow;

  if (preferAbove) {
    return {
      left,
      width,
      top: rect.top - gap,
      transform: "translateY(-100%)",
      maxHeight: Math.max(120, spaceAbove - gap - 16),
    };
  }

  return {
    left,
    width,
    top: rect.bottom + gap,
    maxHeight: Math.max(120, spaceBelow - gap - 16),
  };
}

export function MentionSuggestionsPopover({
  open,
  anchorRef,
  members,
  query,
  activeIndex,
  onSelect,
}: MentionSuggestionsPopoverProps) {
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const suggestions = open ? filterMentionMembers(members, query) : [];

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    function update() {
      if (!anchorRef.current) return;
      setPosition(computePosition(anchorRef.current));
    }

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, query, suggestions.length]);

  if (!open || suggestions.length === 0 || !position || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="listbox"
      aria-label="Mention someone"
      className={cn(
        "fixed z-[200] overflow-hidden rounded-lg border border-border bg-popover shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
      )}
      style={{
        left: position.left,
        width: position.width,
        top: position.top,
        transform: position.transform,
        maxHeight: position.maxHeight,
      }}
    >
      <p className="border-b border-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Mention someone
      </p>
      <ul className="overflow-y-auto py-1" style={{ maxHeight: position.maxHeight - 36 }}>
        {suggestions.map((member, index) => (
          <li key={member.id}>
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(member);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                index === activeIndex && "bg-accent",
              )}
            >
              <ProfileAvatar
                userId={member.id}
                name={member.full_name}
                avatarUrl={member.avatar_url}
                email={member.email}
                size="sm"
              />
              <span className="min-w-0 truncate font-medium">{member.full_name}</span>
              {member.job_title && (
                <span className="ml-auto truncate text-xs text-muted-foreground">
                  {member.job_title}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}
