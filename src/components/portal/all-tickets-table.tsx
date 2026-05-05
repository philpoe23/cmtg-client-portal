"use client";

import { useState } from "react";
import type { CompanyTicket } from "@/types";
import { TicketStatusBadge } from "@/components/portal/ticket-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [100, 200, 250] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface AllTicketsTableProps {
  tickets: CompanyTicket[];
}

export function AllTicketsTable({ tickets }: AllTicketsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(100);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? tickets.filter(
        (t) =>
          (t.summary ?? "").toLowerCase().includes(query) ||
          String(t.ticket_id).includes(query) ||
          (t.contact_name ?? "").toLowerCase().includes(query) ||
          (t.board ?? "").toLowerCase().includes(query) ||
          (t.status ?? "").toLowerCase().includes(query),
      )
    : tickets;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const start = (page - 1) * pageSize;
  const pageTickets = filtered.slice(start, start + pageSize);

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value) as PageSize);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  if (!tickets.length) {
    return <p className="text-sm text-muted-foreground text-center py-16">No tickets found for this period</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input placeholder="Search tickets…" value={search} onChange={(e) => handleSearch(e.target.value)} className="h-8 max-w-xs text-sm" />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Per page</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
          {pageTickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                No tickets match your search
              </TableCell>
            </TableRow>
          ) : (
            pageTickets.map((ticket) => {
              const href = ticket.url ?? `/dashboard/tickets/${ticket.ticket_id}`;
              const external = !!ticket.url;
              const summary = ticket.summary ?? "";
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
                      title={summary || undefined}
                    >
                      {summary.length > 100 ? summary.slice(0, 100) + "…" : summary || "—"}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ticket.board}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ticket.contact_name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ticket.priority}</TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(ticket.date_entered).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length} tickets{query ? ` (filtered from ${tickets.length})` : ""}
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
