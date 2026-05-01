import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-red-500/15 text-red-400 border-red-500/25",
  },
  high: {
    label: "High",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  },
  low: {
    label: "Low",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  },
};

function getPriorityConfig(priority: string) {
  return (
    PRIORITY_MAP[priority.toLowerCase()] ?? {
      label: priority,
      className: "bg-muted text-muted-foreground border-border",
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
    <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", config.className, className)}>
      {config.label}
    </Badge>
  );
}
