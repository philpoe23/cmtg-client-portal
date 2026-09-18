import * as React from "react";
import { cn } from "@/lib/utils";

export function CmtgCard({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-cmtg-border bg-cmtg-surface p-5", className)} {...props} />;
}
