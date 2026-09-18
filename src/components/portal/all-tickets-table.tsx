"use client";

import { useMemo, useRef, useState } from "react";
import type { CompanyTicket, TicketRecord } from "@/types";
import { useLazyReportTickets } from "@/hooks/use-lazy-report-tickets";
import { toCmtgTicket } from "@/components/cmtg/cmtg-ticket-mapping";
import type { CmtgTicketStatus } from "@/components/cmtg/cmtg-types";
import { CmtgInput } from "@/components/cmtg/cmtg-input";
import { CmtgTicketList } from "@/components/cmtg/cmtg-ticket-list";
import { TicketDetailInlinePanel } from "@/components/portal/ticket-detail-inline-panel";

interface AllTicketsTableProps {
  tickets: CompanyTicket[];
  startDate: string;
  endDate: string;
}

export function AllTicketsTable({ tickets, startDate, endDate }: AllTicketsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CmtgTicketStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const { loading: reportLoading, ensureLoaded } = useLazyReportTickets(startDate, endDate);
  const latestRequestRef = useRef<string | null>(null);

  const cmtgTickets = useMemo(() => tickets.map(toCmtgTicket), [tickets]);

  const query = search.trim().toLowerCase();
  const searched = query
    ? cmtgTickets.filter((t) => t.subject.toLowerCase().includes(query) || t.id.includes(query) || t.client.toLowerCase().includes(query))
    : cmtgTickets;

  async function handleSelectTicket(id: string) {
    setSelectedId(id);
    setSelectedTicket(null);
    latestRequestRef.current = id;
    const records = await ensureLoaded();
    if (latestRequestRef.current !== id) return; // a newer click superseded this one
    setSelectedTicket(records.find((r) => String(r["Ticket #"]) === id) ?? null);
  }

  if (!tickets.length) {
    return <p className="text-sm text-cmtg-muted text-center py-16">No tickets found for this period</p>;
  }

  return (
    <div className="space-y-3">
      <CmtgInput placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />

      <div className="grid grid-cols-1 xl:grid-cols-[1.75fr_1fr] gap-4.5 items-start">
        <CmtgTicketList
          tickets={searched}
          selectedTicketId={selectedId}
          onSelectTicket={handleSelectTicket}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
        <TicketDetailInlinePanel ticket={selectedTicket} loading={reportLoading && selectedId !== null} periodLabel="Last 30 Days" />
      </div>
    </div>
  );
}
