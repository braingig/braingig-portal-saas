import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type HoverSelectOption<T extends string> = {
  value: T;
  label: string;
};

type HoverTableSelectProps<T extends string> = {
  value: T;
  options: HoverSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  variant?: "badge" | "link";
  linkLabel?: string;
  badgeClassName?: string;
  "aria-label"?: string;
};

export function HoverTableSelect<T extends string>({
  value,
  options,
  onChange,
  disabled,
  variant = "badge",
  linkLabel = "Change role",
  badgeClassName,
  "aria-label": ariaLabel,
}: HoverTableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = options.find((o) => o.value === value);

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

  function select(next: T) {
    if (next !== value) onChange(next);
    setOpen(false);
  }

  if (disabled) {
    if (variant === "link") {
      return <span className="text-[10px] text-muted-foreground">—</span>;
    }
    return (
      <span
        className={cn(
          "inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          badgeClassName,
        )}
      >
        {selected?.label ?? value}
      </span>
    );
  }

  return (
    <div
      className="w-fit"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            className={cn(
              variant === "badge"
                ? cn(
                    "inline-flex w-fit cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-80",
                    badgeClassName,
                  )
                : "cursor-pointer text-[10px] font-medium text-brand transition-colors hover:underline",
            )}
          >
            {variant === "badge" ? (selected?.label ?? value) : linkLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-auto min-w-[7rem] p-1"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              className={cn(
                "flex w-full cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-surface",
                option.value === value && "bg-brand/10 font-medium text-brand",
              )}
            >
              {option.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
