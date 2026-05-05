"use client";

import { useState } from "react";
import type { CompanyTicket } from "@/types";
import { TicketStatusBadge } from "@/components/portal/ticket-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 25;

interface DashboardTicketsTableProps {
  tickets: CompanyTicket[];
}

export function DashboardTicketsTable({ tickets }: DashboardTicketsTableProps) {
  const [page, setPage] = useState(1);

  const filteredTickets = tickets.filter((t) => t.contact_name);
  const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageTickets = filteredTickets.slice(start, start + PAGE_SIZE);

  if (!filteredTickets.length) {
    return <p className="text-sm text-muted-foreground text-center py-10">No tickets in the last 30 days</p>;
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
          {pageTickets.map((ticket) => {
            const href = ticket.url ?? `/dashboard/tickets/${ticket.ticket_id}`;
            const external = !!ticket.url;
            return (
              <TableRow key={ticket.ticket_id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:underline">
                    #{ticket.ticket_id}
                  </a>
                </TableCell>
                <TableCell className="max-w-xs">
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="hover:underline block truncate"
                    title={ticket.summary ?? undefined}
                  >
                    {(ticket.summary ?? "").length > 100 ? ticket.summary!.slice(0, 100) + "…" : (ticket.summary ?? "—")}
                  </a>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{ticket.board}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ticket.contact_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ticket.priority}</TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(ticket.date_entered).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })}
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
    </div>
  );
}
