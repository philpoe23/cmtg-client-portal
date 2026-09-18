import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cmtgButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent font-sans font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cmtg-blue-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-cmtg-forest text-white hover:bg-cmtg-forest-dark",
        secondary:
          "border-cmtg-forest bg-cmtg-surface text-cmtg-forest hover:bg-cmtg-forest/10 dark:border-cmtg-light-green dark:bg-transparent dark:text-cmtg-light-green dark:hover:bg-cmtg-light-green/10",
        ghost: "text-cmtg-ink hover:bg-cmtg-ink/[0.06]",
        danger: "bg-cmtg-brick text-white hover:bg-[#A63C31]",
      },
      size: {
        default: "px-5 py-[11px] text-sm",
        sm: "rounded-[7px] px-3.5 py-[7px] text-[13px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface CmtgButtonProps extends React.ComponentProps<"button">, VariantProps<typeof cmtgButtonVariants> {}

export function CmtgButton({ className, variant, size, ...props }: CmtgButtonProps) {
  return <button className={cn(cmtgButtonVariants({ variant, size }), className)} {...props} />;
}
