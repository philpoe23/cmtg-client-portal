import * as React from "react";
import { cn } from "@/lib/utils";

export function CmtgSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-cmtg-border bg-cmtg-surface px-3.5 py-2.75 font-sans text-sm text-cmtg-ink focus-visible:outline-2 focus-visible:outline-cmtg-blue-green focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
