import * as React from "react";

import { cn } from "@/lib/utils";
import { dsInput } from "@/lib/design-system";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          dsInput,
          "cursor-text peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
