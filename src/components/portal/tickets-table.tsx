"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import type { Ticket } from "@/types";
import { useTrack } from "@/hooks/use-track";

interface TicketsTableProps {
  tickets: Ticket[];
  loading?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TicketsTable({ tickets, loading }: TicketsTableProps) {
  const { track } = useTrack();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="border border-border rounded-md">
        <p className="text-sm text-muted-foreground text-center py-16">No tickets found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-16 text-xs">#</TableHead>
            <TableHead className="text-xs">Summary</TableHead>
            <TableHead className="w-36 text-xs">Status</TableHead>
            <TableHead className="w-28 text-xs">Priority</TableHead>
            <TableHead className="w-36 text-xs hidden md:table-cell">Board</TableHead>
            <TableHead className="w-32 text-xs hidden lg:table-cell">Assigned To</TableHead>
            <TableHead className="w-28 text-xs hidden lg:table-cell">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="border-border cursor-pointer hover:bg-secondary/40 transition-colors">
              <TableCell className="font-mono text-xs text-muted-foreground">{ticket.id}</TableCell>
              <TableCell>
                <Link
                  href={`/portal/tickets/${ticket.id}`}
                  className="text-sm font-medium hover:underline"
                  onClick={() =>
                    track({
                      event_type: "click",
                      event_name: "open_ticket",
                      metadata: { ticket_id: ticket.id },
                    })
                  }
                >
                  {ticket.summary}
                </Link>
                {ticket.contact_name && <p className="text-xs text-muted-foreground mt-0.5">{ticket.contact_name}</p>}
              </TableCell>
              <TableCell>
                <TicketStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <TicketPriorityBadge priority={ticket.priority} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{ticket.board_name}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{ticket.assigned_to ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{formatDate(ticket.date_last_updated)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
