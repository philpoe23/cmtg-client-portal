import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-cmtg-status-critical-bg text-cmtg-status-critical-fg",
  },
  high: {
    label: "High",
    className: "bg-cmtg-status-pending-bg text-cmtg-status-pending-fg",
  },
  medium: {
    label: "Medium",
    className: "bg-cmtg-status-progress-bg text-cmtg-status-progress-fg",
  },
  low: {
    label: "Low",
    className: "bg-cmtg-status-neutral-bg text-cmtg-status-neutral-fg",
  },
};

function getPriorityConfig(priority: string) {
  return (
    PRIORITY_MAP[priority.toLowerCase()] ?? {
      label: priority,
      className: "bg-cmtg-status-neutral-bg text-cmtg-status-neutral-fg",
    }
  );
}

interface TicketPriorityBadgeProps {
  priority: string;
  className?: string;
}

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const config = getPriorityConfig(priority);
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
