import { CmtgCard } from "./cmtg-card";
import { cn } from "@/lib/utils";

export interface CmtgStatTileProps {
  label: string;
  value: string | number;
  /** Small supporting line under the value, e.g. "▲ down from 10 last week". */
  trend?: string;
  trendTone?: "positive" | "neutral";
  className?: string;
}

export function CmtgStatTile({ label, value, trend, trendTone = "neutral", className }: CmtgStatTileProps) {
  return (
    <CmtgCard className={cn("p-4.5", className)}>
      <div className="font-sans text-xs font-semibold tracking-wide text-cmtg-muted uppercase">{label}</div>
      <div className="font-blueprint mt-1 text-2xl font-semibold text-cmtg-ink">{value}</div>
      {trend && <div className={cn("mt-1 text-xs", trendTone === "positive" ? "text-cmtg-status-resolved-fg" : "text-cmtg-muted")}>{trend}</div>}
    </CmtgCard>
  );
}
