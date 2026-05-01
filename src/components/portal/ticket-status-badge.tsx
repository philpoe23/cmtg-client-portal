import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  "in progress": {
    label: "In Progress",
    className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  },
  "waiting for customer": {
    label: "Waiting",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  closed: {
    label: "Closed",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_MAP[status.toLowerCase()] ?? {
      label: status,
      className: "bg-muted text-muted-foreground border-border",
    }
  );
}

interface TicketStatusBadgeProps {
  status: string;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = getStatusConfig(status);
  return (
    <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", config.className, className)}>
      {config.label}
    </Badge>
  );
}
