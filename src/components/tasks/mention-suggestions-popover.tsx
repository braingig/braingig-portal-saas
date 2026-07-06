import { useLayoutEffect, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { filterMentionMembers } from "@/lib/tasks/comment-mentions";
import type { TaskOrgMember } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export const MENTION_SUGGESTIONS_SELECTOR = "[data-mention-suggestions]";

function isInsideMentionSuggestions(target: EventTarget | null) {
  if (!(target instanceof Node)) return false;
  const element = target instanceof Element ? target : target.parentElement;
  return Boolean(element?.closest(MENTION_SUGGESTIONS_SELECTOR));
}

function isInsideAnchor(anchor: HTMLElement | null, target: EventTarget | null) {
  if (!anchor || !(target instanceof Node)) return false;
  return anchor.contains(target);
}

function resolvePortalContainer(anchor: HTMLElement | null): HTMLElement {
  if (typeof document === "undefined") return document.body;
  const dialog = anchor?.closest('[role="dialog"]');
  if (dialog instanceof HTMLElement) return dialog;
  return document.body;
}

type PopoverPosition = {
  left: number;
  width: number;
  top: number;
  transform?: string;
  maxHeight: number;
  strategy: "fixed" | "absolute";
};

type MentionSuggestionsPopoverProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  members: TaskOrgMember[];
  query: string;
  activeIndex: number;
  onSelect: (member: TaskOrgMember) => void;
  onDismiss?: () => void;
};

function computePosition(anchor: HTMLElement): PopoverPosition {
  const portal = resolvePortalContainer(anchor);
  const useAbsolute = portal !== document.body;
  const anchorRect = anchor.getBoundingClientRect();
  const width = Math.min(384, Math.max(anchorRect.width, 240));
  const gap = 8;
  const estimatedHeight = 220;

  if (useAbsolute) {
    const portalRect = portal.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, anchorRect.left - portalRect.left),
      portalRect.width - width - 8,
    );
    const anchorTop = anchorRect.top - portalRect.top;
    const anchorBottom = anchorRect.bottom - portalRect.top;
    const spaceAbove = anchorTop;
    const spaceBelow = portalRect.height - anchorBottom;
    const preferAbove = spaceAbove >= estimatedHeight || spaceAbove > spaceBelow;

    if (preferAbove) {
      return {
        left,
        width,
        top: anchorTop - gap,
        transform: "translateY(-100%)",
        maxHeight: Math.max(120, spaceAbove - gap - 16),
        strategy: "absolute",
      };
    }

    return {
      left,
      width,
      top: anchorBottom + gap,
      maxHeight: Math.max(120, spaceBelow - gap - 16),
      strategy: "absolute",
    };
  }

  const left = Math.min(Math.max(8, anchorRect.left), window.innerWidth - width - 8);
  const spaceAbove = anchorRect.top;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const preferAbove = spaceAbove >= estimatedHeight || spaceAbove > spaceBelow;

  if (preferAbove) {
    return {
      left,
      width,
      top: anchorRect.top - gap,
      transform: "translateY(-100%)",
      maxHeight: Math.max(120, spaceAbove - gap - 16),
      strategy: "fixed",
    };
  }

  return {
    left,
    width,
    top: anchorRect.bottom + gap,
    maxHeight: Math.max(120, spaceBelow - gap - 16),
    strategy: "fixed",
  };
}

export function MentionSuggestionsPopover({
  open,
  anchorRef,
  members,
  query,
  activeIndex,
  onSelect,
  onDismiss,
}: MentionSuggestionsPopoverProps) {
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const suggestions = open ? filterMentionMembers(members, query) : [];

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      setPortalContainer(null);
      return;
    }

    function update() {
      if (!anchorRef.current) return;
      setPortalContainer(resolvePortalContainer(anchorRef.current));
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

  useEffect(() => {
    if (!open || !onDismiss) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (isInsideAnchor(anchorRef.current, target)) return;
      if (isInsideMentionSuggestions(target)) return;
      onDismiss();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, anchorRef, onDismiss]);

  if (!open || suggestions.length === 0 || !position || !portalContainer || typeof document === "undefined") {
    return null;
  }

  const panel = (
    <div
      data-mention-suggestions
      role="listbox"
      aria-label="Mention someone"
      className={cn(
        position.strategy === "fixed" ? "fixed" : "absolute",
        "z-[300] pointer-events-auto overflow-hidden rounded-lg border border-border bg-popover shadow-xl",
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
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(member);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
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
    </div>
  );

  if (portalContainer === document.body) {
    return createPortal(panel, portalContainer);
  }

  return createPortal(panel, portalContainer);
}
