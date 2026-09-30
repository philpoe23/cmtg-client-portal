import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-cmtg-status-info-bg text-cmtg-status-info-fg",
  },
  "in progress": {
    label: "In Progress",
    className: "bg-cmtg-status-progress-bg text-cmtg-status-progress-fg",
  },
  "waiting for customer": {
    label: "Waiting",
    className: "bg-cmtg-status-pending-bg text-cmtg-status-pending-fg",
  },
  pending: {
    label: "Pending",
    className: "bg-cmtg-status-pending-bg text-cmtg-status-pending-fg",
  },
  closed: {
    label: "Closed",
    className: "bg-cmtg-status-resolved-bg text-cmtg-status-resolved-fg",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_MAP[status.toLowerCase()] ?? {
      label: status,
      className: "bg-cmtg-status-neutral-bg text-cmtg-status-neutral-fg",
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
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
