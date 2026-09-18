"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CompanyTicket, TicketRecord } from "@/types";
import { useLazyReportTickets } from "@/hooks/use-lazy-report-tickets";
import { CmtgStatusBadge } from "@/components/cmtg/cmtg-status-badge";
import { CmtgButton } from "@/components/cmtg/cmtg-button";
import { mapTicketStatus } from "@/components/cmtg/cmtg-ticket-mapping";
import { TicketDetailDialog, PriorityChip, formatDate } from "@/components/portal/report-tickets-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 25;

interface DashboardTicketsTableProps {
  tickets: CompanyTicket[];
  startDate: string;
  endDate: string;
}

export function DashboardTicketsTable({ tickets, startDate, endDate }: DashboardTicketsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState<number | null>(null);
  const { tickets: reportTickets, ensureLoaded } = useLazyReportTickets(startDate, endDate);

  // Kick off the (slow) report fetch in the background as soon as the table
  // mounts, instead of waiting for a row click — mirrors the Service Summary
  // Report page, where all this data is already loaded by the time you can
  // click a row, so opening the dialog is instant.
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  async function handleRowClick(ticket: CompanyTicket) {
    if (reportTickets === null) setPendingTicketId(ticket.ticket_id);
    try {
      const records = await ensureLoaded();
      const record = records.find((r) => r["Ticket #"] === ticket.ticket_id);
      if (!record) {
        toast.error("Ticket details are not available for this ticket.");
        return;
      }
      setSelectedTicket(record);
      setDialogOpen(true);
    } finally {
      setPendingTicketId(null);
    }
  }

  const filteredTickets = tickets.filter((t) => t.contact_name);
  const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageTickets = filteredTickets.slice(start, start + PAGE_SIZE);

  if (!filteredTickets.length) {
    return <p className="text-sm text-muted-foreground text-center py-10">No open, in-progress, or waiting tickets in the last 30 days</p>;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-22.5">Ticket #</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead className="w-40">Board</TableHead>
            <TableHead className="w-36">Contact</TableHead>
            <TableHead className="w-27.5">Priority</TableHead>
            <TableHead className="w-35">Status</TableHead>
            <TableHead className="w-27.5">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageTickets.map((ticket) => (
            <TableRow
              key={ticket.ticket_id}
              className="cursor-pointer hover:bg-secondary/40 aria-busy:opacity-60"
              aria-busy={pendingTicketId === ticket.ticket_id}
              onClick={() => handleRowClick(ticket)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">#{ticket.ticket_id}</TableCell>
              <TableCell className="max-w-xs truncate" title={ticket.summary ?? undefined}>
                {(ticket.summary ?? "").length > 100 ? ticket.summary!.slice(0, 100) + "…" : (ticket.summary ?? "—")}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{ticket.board}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{ticket.contact_name}</TableCell>
              <TableCell>
                <PriorityChip value={ticket.priority} />
              </TableCell>
              <TableCell>
                <CmtgStatusBadge status={mapTicketStatus(ticket.status)} label={ticket.status} size="sm" />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.date_entered)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length} tickets
          </p>
          <div className="flex items-center gap-2">
            <CmtgButton type="button" variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </CmtgButton>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <CmtgButton type="button" variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </CmtgButton>
          </div>
        </div>
      )}

      {selectedTicket && <TicketDetailDialog ticket={selectedTicket} open={dialogOpen} onClose={() => setDialogOpen(false)} periodLabel="Last 30 Days" />}
    </div>
  );
}
