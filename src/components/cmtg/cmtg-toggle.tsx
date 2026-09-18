import { cn } from "@/lib/utils";

export interface CmtgToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name — required since the toggle has no visible label of its own. */
  "aria-label": string;
  disabled?: boolean;
  className?: string;
}

export function CmtgToggle({ checked, onCheckedChange, disabled, className, ...props }: CmtgToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6.5 w-11 shrink-0 cursor-pointer rounded-full border-none p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-cmtg-forest" : "bg-cmtg-border",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-[left] duration-150 ease-out",
          checked ? "left-5" : "left-0.5",
        )}
      />
    </button>
  );
}
