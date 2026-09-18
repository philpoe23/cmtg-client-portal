import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { CmtgCard } from "./cmtg-card";
import { CmtgStatusBadge } from "./cmtg-status-badge";
import type { CmtgTicket, CmtgTicketStatus } from "./cmtg-types";

const FILTER_OPTIONS: Array<{ label: string; status: CmtgTicketStatus | null }> = [
  { label: "All", status: null },
  { label: "Pending", status: "pending" },
  { label: "In progress", status: "in-progress" },
  { label: "Resolved", status: "resolved" },
];

const PRIORITY_COLOR: Record<CmtgTicket["priority"], string> = {
  critical: "text-cmtg-status-critical-fg",
  high: "text-cmtg-status-pending-fg",
  normal: "text-cmtg-body",
  low: "text-cmtg-body",
};

const PRIORITY_LABEL: Record<CmtgTicket["priority"], string> = {
  critical: "Critical",
  high: "High",
  normal: "Normal",
  low: "Low",
};

export interface CmtgTicketListProps {
  tickets: CmtgTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  /** Controlled active filter — null means "All". */
  activeFilter: CmtgTicketStatus | null;
  onFilterChange: (status: CmtgTicketStatus | null) => void;
  className?: string;
}

export function CmtgTicketList({ tickets, selectedTicketId, onSelectTicket, activeFilter, onFilterChange, className }: CmtgTicketListProps) {
  const filtered = useMemo(() => (activeFilter === null ? tickets : tickets.filter((t) => t.status === activeFilter)), [tickets, activeFilter]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.status === activeFilter;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onFilterChange(option.status)}
              aria-pressed={isActive}
              className={cn(
                "cursor-pointer rounded-full border border-cmtg-border px-3.5 py-[7px] font-sans text-[13px] font-semibold",
                isActive ? "bg-cmtg-forest text-white" : "bg-cmtg-surface text-cmtg-body",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <CmtgCard className="flex flex-col overflow-hidden p-0 px-5">
        <div className="grid grid-cols-[2.2fr_1.2fr_1fr_0.8fr_0.9fr] items-center gap-2 border-b border-cmtg-border py-3.5 font-sans text-[11px] font-semibold tracking-wide text-cmtg-muted uppercase">
          <div>Ticket</div>
          <div>Client</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Updated</div>
        </div>
        <div className="overflow-y-auto">
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-cmtg-muted">No tickets match this filter.</p>}
          {filtered.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelectTicket(ticket.id)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "grid w-full cursor-pointer grid-cols-[2.2fr_1.2fr_1fr_0.8fr_0.9fr] items-center gap-2 border-b border-cmtg-border py-3.5 text-left font-sans",
                  isSelected ? "bg-cmtg-forest/7" : "bg-cmtg-surface hover:bg-cmtg-bg",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-cmtg-ink">{ticket.subject}</div>
                  <div className="text-xs text-cmtg-muted">#{ticket.id}</div>
                </div>
                <div className="truncate text-[13px] text-cmtg-body">{ticket.client}</div>
                <div>
                  <CmtgStatusBadge status={ticket.status} size="sm" />
                </div>
                <div className={cn("text-[13px] font-semibold", PRIORITY_COLOR[ticket.priority])}>{PRIORITY_LABEL[ticket.priority]}</div>
                <div className="text-xs text-cmtg-muted">{ticket.updated}</div>
              </button>
            );
          })}
        </div>
      </CmtgCard>
    </div>
  );
}
