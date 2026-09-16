"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CompanyTicket, TicketRecord } from "@/types";
import { TicketStatusBadge } from "@/components/portal/ticket-status-badge";
import { TicketDetailDialog } from "@/components/portal/report-tickets-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 25;

interface DashboardTicketsTableProps {
  tickets: CompanyTicket[];
  reportTickets: TicketRecord[];
}

export function DashboardTicketsTable({ tickets, reportTickets }: DashboardTicketsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reportTicketsById = useMemo(() => new Map(reportTickets.map((t) => [t["Ticket #"], t])), [reportTickets]);

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
              className="cursor-pointer hover:bg-secondary/40"
              onClick={() => {
                const record = reportTicketsById.get(ticket.ticket_id);
                if (!record) {
                  toast.error("Ticket details are not available for this ticket.");
                  return;
                }
                setSelectedTicket(record);
                setDialogOpen(true);
              }}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">#{ticket.ticket_id}</TableCell>
              <TableCell className="max-w-xs truncate" title={ticket.summary ?? undefined}>
                {(ticket.summary ?? "").length > 100 ? ticket.summary!.slice(0, 100) + "…" : (ticket.summary ?? "—")}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{ticket.board}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{ticket.contact_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{ticket.priority}</TableCell>
              <TableCell>
                <TicketStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(ticket.date_entered).toLocaleDateString()}</TableCell>
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
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {selectedTicket && <TicketDetailDialog ticket={selectedTicket} open={dialogOpen} onClose={() => setDialogOpen(false)} periodLabel="Last 30 Days" />}
    </div>
  );
}
