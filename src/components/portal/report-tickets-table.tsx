"use client";

import type { ReactNode } from "react";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketRecord } from "@/types";

type SortKey = keyof TicketRecord;
type SortDir = "asc" | "desc";

// ─── SLA helpers ─────────────────────────────────────────────────────────────

function getSlaMetCount(ticket: TicketRecord): number {
  return [ticket["SLA Response"], ticket["SLA Plan"], ticket["SLA Resolution"]].filter((v) => v === "Met").length;
}

function getSlaColor(count: number): string {
  if (count === 3) return "#70AD47";
  if (count === 2) return "#FFC000";
  if (count === 1) return "#FF6B6B";
  return "#C00000";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SlaAttainmentBadge({ value }: { value: string }) {
  const cls =
    value === "Met"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
      : value === "Missed"
        ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
  return (
    <Badge variant="outline" className={cn("text-xs font-normal", cls)}>
      {value}
    </Badge>
  );
}

function SlaStatusChip({ ticket }: { ticket: TicketRecord }) {
  const count = getSlaMetCount(ticket);
  const color = getSlaColor(count);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span
            className="inline-flex cursor-default select-none items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {count}/3
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Response: {ticket["SLA Response"]}</p>
          <p>Plan: {ticket["SLA Plan"]}</p>
          <p>Resolution: {ticket["SLA Resolution"]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HoursSummaryBar({ tickets }: { tickets: TicketRecord[] }) {
  const ssa = tickets.reduce((s, t) => s + (t["SSA Hours"] ?? 0), 0);
  const msa = tickets.reduce((s, t) => s + (t["MSA Hours"] ?? 0), 0);
  const dedicated = tickets.reduce((s, t) => s + (t["Dedicated Resource Hours"] ?? 0), 0);
  const noAgreement = tickets.reduce((s, t) => s + (t["No Agreement Hours"] ?? 0), 0);
  const total = tickets.reduce((s, t) => s + (t["Total Hours"] ?? 0), 0);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
      <span>
        <span className="text-muted-foreground">SSA: </span>
        <strong>{ssa.toFixed(2)}</strong> hrs
      </span>
      <span>
        <span className="text-muted-foreground">MSA: </span>
        <strong>{msa.toFixed(2)}</strong> hrs
      </span>
      <span>
        <span className="text-muted-foreground">Dedicated: </span>
        <strong>{dedicated.toFixed(2)}</strong> hrs
      </span>
      <span>
        <span className="text-muted-foreground">No Agreement: </span>
        <strong>{noAgreement.toFixed(2)}</strong> hrs
      </span>
      <Separator orientation="vertical" className="hidden h-4 sm:block" />
      <span className="font-semibold">
        <span className="font-normal text-muted-foreground">Total: </span>
        {total.toFixed(2)} hrs
      </span>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Sortable header ─────────────────────────────────────────────────────────

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}

function SortableHeader({ label, sortKey, currentSort, currentDir, onSort, className }: SortableHeaderProps) {
  const isActive = currentSort === sortKey;
  return (
    <TableHead className={cn("cursor-pointer select-none whitespace-nowrap text-xs", className)} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="text-muted-foreground/50" />
        )}
      </span>
    </TableHead>
  );
}

// ─── Field (detail dialog helper) ────────────────────────────────────────────

function Field({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children ?? <p className="font-medium">{value || "—"}</p>}
    </div>
  );
}

function TextBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}

// ─── Ticket detail dialog ────────────────────────────────────────────────────

function TicketDetailDialog({ ticket, open, onClose }: { ticket: TicketRecord; open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ticket #{ticket["Ticket #"]}</DialogTitle>
          <DialogDescription className="sr-only">{ticket.Summary || "Ticket detail"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Created" value={formatDate(ticket["Created Date"])} />
            <Field label="Resolved" value={formatDate(ticket["Resolved Date"])} />
            <Field label="Board" value={ticket.Board} />
            <Field label="Ticket Type" value={ticket["Ticket Type"]} />
            <Field label="Sub Type" value={ticket["Sub Type"]} />
            <Field label="SLA Priority" value={ticket["SLA Priority"]} />
            <Field label="Primary Contact" value={ticket["Primary Contact"]} />
            <Field label="Site" value={ticket.Site} />
            <Field label="Techs Worked" value={ticket["Techs Worked"]} />
            <Field label="Agreements Used" value={ticket["Agreements Used"]} />
          </div>

          <Separator />

          {/* SLA */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">SLA</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Attainment">
                <SlaAttainmentBadge value={ticket["SLA Attainment"]} />
              </Field>
              <Field label="Response" value={ticket["SLA Response"]} />
              <Field label="Plan" value={ticket["SLA Plan"]} />
              <Field label="Resolution" value={ticket["SLA Resolution"]} />
            </div>
          </div>

          <Separator />

          {/* Hours */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Hours</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <Field label="SSA" value={(ticket["SSA Hours"] ?? 0).toFixed(2)} />
              <Field label="MSA" value={(ticket["MSA Hours"] ?? 0).toFixed(2)} />
              <Field label="Dedicated" value={(ticket["Dedicated Resource Hours"] ?? 0).toFixed(2)} />
              <Field label="No Agreement" value={(ticket["No Agreement Hours"] ?? 0).toFixed(2)} />
              <Field label="Written Off" value={(ticket["Written Off / Non-Billable Hours"] ?? 0).toFixed(2)} />
              <Field label="Total" value={(ticket["Total Hours"] ?? 0).toFixed(2)} />
            </div>
          </div>

          {/* Text blocks */}
          {(ticket.Summary || ticket.Detail || ticket.Resolution) && <Separator />}
          {ticket.Summary && <TextBlock label="Summary" text={ticket.Summary} />}
          {ticket.Detail && <TextBlock label="Detail" text={ticket.Detail} />}
          {ticket.Resolution && <TextBlock label="Resolution" text={ticket.Resolution} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Per-tab table ────────────────────────────────────────────────────────────

function TicketsTabContent({ tickets }: { tickets: TicketRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("Ticket #");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function openTicket(ticket: TicketRecord) {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        String(t["Ticket #"]).includes(q) ||
        t["Primary Contact"].toLowerCase().includes(q) ||
        t.Summary.toLowerCase().includes(q) ||
        t.Board.toLowerCase().includes(q) ||
        t["Ticket Type"].toLowerCase().includes(q),
    );
  }, [tickets, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const shProps = { currentSort: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className="space-y-3">
      <HoursSummaryBar tickets={tickets} />

      <Input
        placeholder="Search by ticket #, contact, summary, board…"
        className="h-8 w-72 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {sorted.length === 0 ? (
        <div className="rounded-md border border-border">
          <p className="py-12 text-center text-sm text-muted-foreground">No tickets found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <SortableHeader label="Ticket #" sortKey="Ticket #" {...shProps} className="w-20" />
                <SortableHeader label="Created" sortKey="Created Date" {...shProps} className="hidden w-28 md:table-cell" />
                <SortableHeader label="Contact" sortKey="Primary Contact" {...shProps} className="hidden w-36 md:table-cell" />
                <SortableHeader label="Board" sortKey="Board" {...shProps} className="hidden w-32 lg:table-cell" />
                <SortableHeader label="Type" sortKey="Ticket Type" {...shProps} className="hidden w-28 lg:table-cell" />
                <SortableHeader label="Priority" sortKey="SLA Priority" {...shProps} className="hidden w-24 lg:table-cell" />
                <SortableHeader label="Attainment" sortKey="SLA Attainment" {...shProps} className="w-24" />
                <TableHead className="w-20 text-xs">SLA Status</TableHead>
                <SortableHeader label="Techs" sortKey="Techs Worked" {...shProps} className="hidden w-36 xl:table-cell" />
                <SortableHeader label="Agreement" sortKey="Agreements Used" {...shProps} className="hidden w-28 xl:table-cell" />
                <SortableHeader label="SSA hrs" sortKey="SSA Hours" {...shProps} className="hidden w-20 text-right xl:table-cell" />
                <SortableHeader label="MSA hrs" sortKey="MSA Hours" {...shProps} className="hidden w-20 text-right xl:table-cell" />
                <SortableHeader label="Total hrs" sortKey="Total Hours" {...shProps} className="w-20 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((ticket, idx) => (
                <TableRow
                  key={`${ticket["Ticket #"]}-${idx}`}
                  className="cursor-pointer border-border transition-colors hover:bg-secondary/40"
                  onClick={() => openTicket(ticket)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{ticket["Ticket #"]}</TableCell>
                  <TableCell className="hidden text-xs md:table-cell">{formatDate(ticket["Created Date"])}</TableCell>
                  <TableCell className="hidden text-xs md:table-cell">{ticket["Primary Contact"]}</TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">{ticket.Board}</TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">{ticket["Ticket Type"]}</TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">{ticket["SLA Priority"]}</TableCell>
                  <TableCell>
                    <SlaAttainmentBadge value={ticket["SLA Attainment"]} />
                  </TableCell>
                  <TableCell>
                    <SlaStatusChip ticket={ticket} />
                  </TableCell>
                  <TableCell className="hidden text-xs xl:table-cell">{ticket["Techs Worked"]}</TableCell>
                  <TableCell className="hidden text-xs xl:table-cell">{ticket["Agreements Used"]}</TableCell>
                  <TableCell className="hidden text-right text-xs xl:table-cell">{(ticket["SSA Hours"] ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="hidden text-right text-xs xl:table-cell">{(ticket["MSA Hours"] ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{(ticket["Total Hours"] ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedTicket && <TicketDetailDialog ticket={selectedTicket} open={dialogOpen} onClose={closeDialog} />}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface ReportTicketsTableProps {
  tickets: TicketRecord[];
  total: number;
}

export default function ReportTicketsTable({ tickets, total }: ReportTicketsTableProps) {
  const open = useMemo(() => tickets.filter((t) => t.Closed_Flag === 0), [tickets]);
  const closed = useMemo(() => tickets.filter((t) => t.Closed_Flag === 1), [tickets]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} ticket{total !== 1 ? "s" : ""} in report
      </p>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-3">
          <TicketsTabContent tickets={tickets} />
        </TabsContent>
        <TabsContent value="open" className="mt-3">
          <TicketsTabContent tickets={open} />
        </TabsContent>
        <TabsContent value="closed" className="mt-3">
          <TicketsTabContent tickets={closed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
