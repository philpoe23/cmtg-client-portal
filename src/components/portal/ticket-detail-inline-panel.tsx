import { TicketDetailContent } from "@/components/portal/report-tickets-table";
import type { TicketRecord } from "@/types";

interface TicketDetailInlinePanelProps {
  ticket: TicketRecord | null;
  loading: boolean;
  periodLabel: string;
}

export function TicketDetailInlinePanel({ ticket, loading, periodLabel }: TicketDetailInlinePanelProps) {
  return (
    <div className="rounded-xl border border-cmtg-border bg-cmtg-surface p-5 overflow-y-auto">
      {loading ? (
        <p className="flex h-full items-center justify-center text-sm text-cmtg-muted">Loading ticket details…</p>
      ) : ticket ? (
        <>
          <h2 className="mb-4 font-blueprint text-base font-semibold text-cmtg-ink">Ticket #{ticket["Ticket #"]}</h2>
          <TicketDetailContent ticket={ticket} periodLabel={periodLabel} />
        </>
      ) : (
        <p className="flex h-full items-center justify-center text-sm text-cmtg-muted">Select a ticket to see its details.</p>
      )}
    </div>
  );
}
