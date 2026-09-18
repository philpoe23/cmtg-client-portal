import { cn } from "@/lib/utils";
import type { CmtgTicketStatus } from "./cmtg-types";

// Background+opacity and text colors both shift between light/dark (not just
// hue), so these come from paired CSS vars (see :root/.dark in globals.css)
// applied inline, rather than Tailwind's static opacity-modifier classes.
const STATUS_CONFIG: Record<CmtgTicketStatus, { label: string; bgVar: string; fgVar: string }> = {
  resolved: { label: "Resolved", bgVar: "--cmtg-status-resolved-bg", fgVar: "--cmtg-status-resolved-fg" },
  "in-progress": { label: "In progress", bgVar: "--cmtg-status-progress-bg", fgVar: "--cmtg-status-progress-fg" },
  pending: { label: "Pending", bgVar: "--cmtg-status-pending-bg", fgVar: "--cmtg-status-pending-fg" },
  critical: { label: "Critical", bgVar: "--cmtg-status-critical-bg", fgVar: "--cmtg-status-critical-fg" },
  info: { label: "Info", bgVar: "--cmtg-status-info-bg", fgVar: "--cmtg-status-info-fg" },
};

export interface CmtgStatusBadgeProps {
  status: CmtgTicketStatus;
  /** Overrides the default label text for this status. */
  label?: string;
  size?: "default" | "sm";
  className?: string;
}

export function CmtgStatusBadge({ status, label, size = "default", className }: CmtgStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-sans leading-none font-semibold whitespace-nowrap",
        size === "default" ? "px-3 py-[5px] text-xs" : "px-2.5 py-1 text-[11px]",
        className,
      )}
      style={{ background: `var(${config.bgVar})`, color: `var(${config.fgVar})` }}
    >
      {label ?? config.label}
    </span>
  );
}
