"use client";

import type { ReactNode } from "react";
import { useState, useMemo } from "react";
import { type DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, MapPin, Search, SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketRecord } from "@/types";

type SortKey = keyof TicketRecord;
type SortDir = "asc" | "desc";

// ─── Smart Search definitions ─────────────────────────────────────────────────

type SearchType = "text" | "number" | "combobox" | "date";

interface ColumnDef {
  key: string;
  header: string;
  searchType: SearchType;
  getValue: (t: TicketRecord) => string;
}

const SEARCHABLE_COLUMNS: ColumnDef[] = [
  { key: "Ticket #", header: "Ticket #", searchType: "number", getValue: (t) => String(t["Ticket #"]) },
  { key: "Primary Contact", header: "Contact", searchType: "text", getValue: (t) => t["Primary Contact"] },
  { key: "Summary", header: "Summary", searchType: "text", getValue: (t) => t.Summary },
  { key: "Board", header: "Board", searchType: "combobox", getValue: (t) => t.Board },
  { key: "Ticket Type", header: "Type", searchType: "combobox", getValue: (t) => t["Ticket Type"] },
  { key: "Sub Type", header: "Sub Type", searchType: "combobox", getValue: (t) => t["Sub Type"] },
  { key: "SLA Priority", header: "Priority", searchType: "combobox", getValue: (t) => t["SLA Priority"] },
  { key: "Techs Worked", header: "Technician", searchType: "text", getValue: (t) => t["Techs Worked"] },
  { key: "Site", header: "Site", searchType: "combobox", getValue: (t) => t.Site },
  { key: "Created Date", header: "Created Date", searchType: "date", getValue: (t) => t["Created Date"] ?? "" },
];

// ─── Smart Search Bar ─────────────────────────────────────────────────────────

function SmartSearchBar({
  data,
  searchColumn,
  setSearchColumn,
  searchValue,
  setSearchValue,
  searchDate,
  setSearchDate,
}: {
  data: TicketRecord[];
  searchColumn: ColumnDef;
  setSearchColumn: (col: ColumnDef) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  searchDate: DateRange | undefined;
  setSearchDate: (d: DateRange | undefined) => void;
}) {
  const comboboxOptions = useMemo(() => {
    if (searchColumn.searchType !== "combobox") return [];
    const values = new Set(data.map((t) => searchColumn.getValue(t)).filter(Boolean));
    return Array.from(values).sort();
  }, [data, searchColumn]);

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-background shadow-xs transition-shadow focus-within:ring-[3px] focus-within:ring-ring/50">
      {/* Column picker */}
      <Popover>
        <PopoverTrigger>
          <Button variant="outline" size="sm" className="rounded-r-none border-r-0 gap-1 px-2.5 shrink-0 h-9">
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs max-w-20 truncate">{searchColumn.header}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1 gap-1">
          {SEARCHABLE_COLUMNS.map((col) => (
            <button
              key={col.key}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-accent ${searchColumn.key === col.key ? "bg-accent font-medium" : ""}`}
              onClick={() => {
                setSearchColumn(col);
                setSearchValue("");
                setSearchDate(undefined);
              }}
            >
              {col.header}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Date input */}
      {searchColumn.searchType === "date" && (
        <div className="flex flex-1 [&_button]:h-full [&_button]:rounded-none [&_button]:border-0 [&_button]:bg-transparent [&_button]:shadow-none">
          <DatePickerWithRange value={searchDate} onSelect={setSearchDate} />
        </div>
      )}

      {/* Combobox input */}
      {searchColumn.searchType === "combobox" && (
        <Combobox<string> value={searchValue} onValueChange={(v) => setSearchValue(v ?? "")}>
          <ComboboxInput
            placeholder={`Filter by ${searchColumn.header.toLowerCase()}…`}
            className="rounded-none border-0 bg-transparent shadow-none dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-0"
            showTrigger={false}
            showClear={!!searchValue}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <ComboboxContent>
            <ComboboxList>
              {comboboxOptions.map((o) => (
                <ComboboxItem key={o} value={o}>
                  {o}
                </ComboboxItem>
              ))}
              <ComboboxEmpty>No options</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}

      {/* Text / Number inputs */}
      {(searchColumn.searchType === "text" || searchColumn.searchType === "number") && (
        <input
          type={searchColumn.searchType === "number" ? "number" : "text"}
          placeholder={`Search by ${searchColumn.header.toLowerCase()}`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-full w-48 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}

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

function SlaSubBadge({ value }: { value: string }) {
  const cls =
    value === "Met"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
      : value === "Not Met"
        ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
  return (
    <Badge variant="outline" className={cn("text-xs font-normal", cls)}>
      {value || "—"}
    </Badge>
  );
}

function StatusChip({ closed }: { closed: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        closed
          ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300"
          : "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      }
    >
      {closed ? "Closed" : "Open"}
    </Badge>
  );
}

export function PriorityChip({ value }: { value: string }) {
  const cls =
    value === "Critical"
      ? "border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
      : value === "High"
        ? "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        : value === "Medium"
          ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300";
  return (
    <Badge variant="outline" className={cn("text-xs font-normal", cls)}>
      {value || "—"}
    </Badge>
  );
}

const TECH_COLORS = [
  "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "border-pink-300 bg-pink-100 text-pink-800 dark:border-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "border-lime-300 bg-lime-100 text-lime-800 dark:border-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
];

function techColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % TECH_COLORS.length;
}

function TechsChips({ value }: { value: string }) {
  if (!value) return <span className="text-sm font-medium">—</span>;
  const techs = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1">
      {techs.map((tech) => (
        <Badge key={tech} variant="outline" className={cn("text-xs font-normal", TECH_COLORS[techColorIndex(tech)])}>
          {tech}
        </Badge>
      ))}
    </div>
  );
}

function SiteChip({ value }: { value: string }) {
  if (!value) return <span className="text-sm font-medium">—</span>;
  return (
    <Badge
      variant="outline"
      className="gap-1 text-xs font-normal border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300"
    >
      <MapPin className="size-3" />
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
            {count} met
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
      <span>
        <span className="text-muted-foreground">SSA </span>
        <strong>{ssa.toFixed(2)}h</strong>
      </span>
      <span>
        <span className="text-muted-foreground">MSA </span>
        <strong>{msa.toFixed(2)}h</strong>
      </span>
      <span>
        <span className="text-muted-foreground">Dedicated Resource </span>
        <strong>{dedicated.toFixed(2)}h</strong>
      </span>
      {noAgreement > 0 && (
        <span>
          <span className="text-muted-foreground">No Agreement </span>
          <strong>{noAgreement.toFixed(2)}h</strong>
        </span>
      )}
      <Separator orientation="vertical" className="hidden h-4 sm:block" />
      <span>
        <span className="text-muted-foreground">Total </span>
        <strong>{total.toFixed(2)}h</strong>
      </span>
    </div>
  );
}

export function formatDate(dateStr: string | null | undefined): string {
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

// ─── CSV export ────────────────────────────────────────────────────────────

function csvCell(value: string | number): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const CSV_COLUMNS: Array<{ header: string; getValue: (t: TicketRecord) => string | number }> = [
  { header: "Ticket #", getValue: (t) => t["Ticket #"] },
  { header: "Created Date", getValue: (t) => formatDate(t["Created Date"]) },
  { header: "Resolved Date", getValue: (t) => formatDate(t["Resolved Date"]) },
  { header: "Contact", getValue: (t) => t["Primary Contact"] },
  { header: "Site", getValue: (t) => t.Site },
  { header: "Board", getValue: (t) => t.Board },
  { header: "Type", getValue: (t) => t["Ticket Type"] },
  { header: "Sub Type", getValue: (t) => t["Sub Type"] },
  { header: "Priority", getValue: (t) => t["SLA Priority"] },
  { header: "SLA Attainment", getValue: (t) => t["SLA Attainment"] },
  { header: "Techs Worked", getValue: (t) => t["Techs Worked"] },
  { header: "SSA Hours", getValue: (t) => (t["SSA Hours"] ?? 0).toFixed(2) },
  { header: "MSA Hours", getValue: (t) => (t["MSA Hours"] ?? 0).toFixed(2) },
  { header: "Dedicated Hours", getValue: (t) => (t["Dedicated Resource Hours"] ?? 0).toFixed(2) },
  { header: "No Agreement Hours", getValue: (t) => (t["No Agreement Hours"] ?? 0).toFixed(2) },
  { header: "Written Off Hours", getValue: (t) => (t["Written Off / Non-Billable Hours"] ?? 0).toFixed(2) },
  { header: "Total Hours", getValue: (t) => Number(t.hours_summary?.total_hours ?? t["Total Hours"] ?? 0).toFixed(2) },
  { header: "Summary", getValue: (t) => t.Summary },
];

function exportTicketsToCsv(tickets: TicketRecord[], filename: string) {
  const rows = [CSV_COLUMNS.map((c) => csvCell(c.header)), ...tickets.map((t) => CSV_COLUMNS.map((c) => csvCell(c.getValue(t))))];
  const csv = rows.map((row) => row.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

function Field({ label, value, children, className }: { label: string; value?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children ?? <p className="font-medium">{value || "\u2014"}</p>}
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

// ─── Ticket detail content (shared by the dialog and any inline panel) ───────

export function TicketDetailContent({ ticket, periodLabel }: { ticket: TicketRecord; periodLabel: string }) {
  return (
    <div className="grid gap-6">
      {/* Chips row — always visible */}
        <div className="flex flex-wrap gap-2">
          <StatusChip closed={ticket.Closed_Flag === 1} />
          <PriorityChip value={ticket["SLA Priority"]} />
          {ticket.Board && (
            <Badge variant="outline" className="text-xs font-normal">
              {ticket.Board}
            </Badge>
          )}
          {ticket["Ticket Type"] && (
            <Badge variant="outline" className="text-xs font-normal">
              {ticket["Ticket Type"]}
            </Badge>
          )}
          {ticket["Sub Type"] && (
            <Badge variant="outline" className="text-xs font-normal">
              {ticket["Sub Type"]}
            </Badge>
          )}
        </div>

        {/* Static sections — always visible */}
        <div className="space-y-4 text-sm">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Created" value={formatDate(ticket["Created Date"])} />
            <Field label="Resolved" value={formatDate(ticket["Resolved Date"])} />
            <Field label="Primary Contact" value={ticket["Primary Contact"]} />
            <Field label="Site">
              <SiteChip value={ticket.Site} />
            </Field>
            <Field label="Agreements Used" value={ticket["Agreements Used"]} />
            <Field label="Techs Worked" className="col-span-2 sm:col-span-3">
              <TechsChips value={ticket["Techs Worked"]} />
            </Field>
          </div>

          <Separator />

          {/* SLA */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">SLA</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Attainment">
                <SlaAttainmentBadge value={ticket["SLA Attainment"]} />
              </Field>
              <Field label="Response">
                <SlaSubBadge value={ticket["SLA Response"]} />
              </Field>
              <Field label="Plan">
                <SlaSubBadge value={ticket["SLA Plan"]} />
              </Field>
              <Field label="Resolution">
                <SlaSubBadge value={ticket["SLA Resolution"]} />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Period hours */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{periodLabel} Hours</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <Field label="SSA" value={(ticket["SSA Hours"] ?? 0).toFixed(2)} />
              <Field label="MSA" value={(ticket["MSA Hours"] ?? 0).toFixed(2)} />
              <Field label="Dedicated" value={(ticket["Dedicated Resource Hours"] ?? 0).toFixed(2)} />
              <Field label="No Agreement" value={(ticket["No Agreement Hours"] ?? 0).toFixed(2)} />
              <Field label="Written Off">
                {(() => {
                  const v = ticket["Written Off / Non-Billable Hours"] ?? 0;
                  return <p className={v > 0 ? "font-bold text-amber-600 dark:text-amber-400" : "font-medium"}>{v.toFixed(2)}</p>;
                })()}
              </Field>
              <Field label="Total" value={(ticket["Total Hours"] ?? 0).toFixed(2)} />
            </div>
          </div>

          <Separator />

          {/* All-time hours */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">All Time Hours</p>
            {ticket.hours_summary ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {(() => {
                  let ssa = 0,
                    msa = 0,
                    dedicated = 0,
                    noAgreement = 0,
                    writtenOff = 0;
                  for (const period of ticket.hours_summary!.by_period ?? []) {
                    for (const entry of period.entries) {
                      const ag = (entry.agreement ?? "").toLowerCase();
                      const billable = Number(entry.billable_hours) || 0;
                      writtenOff += Number(entry.non_billable_hours) || 0;
                      if (ag.includes("ssa")) ssa += billable;
                      else if (ag.includes("msa")) msa += billable;
                      else if (ag.includes("dedicated")) dedicated += billable;
                      else noAgreement += billable;
                    }
                  }
                  const total = Number(ticket.hours_summary!.total_hours) || 0;
                  return (
                    <>
                      <Field label="SSA" value={ssa.toFixed(2)} />
                      <Field label="MSA" value={msa.toFixed(2)} />
                      <Field label="Dedicated" value={dedicated.toFixed(2)} />
                      <Field label="No Agreement" value={noAgreement.toFixed(2)} />
                      <Field label="Written Off">
                        <p
                          className={writtenOff > 0 ? "font-bold text-amber-600 dark:text-amber-400" : "font-medium"}
                          style={writtenOff > 0 ? { color: "oklch(66.6% 0.179 58.318)" } : undefined}
                        >
                          {writtenOff.toFixed(2)}
                        </p>
                      </Field>
                      <Field label="Total">
                        <p className="font-medium" style={{ color: "#0A7171" }}>
                          {total.toFixed(2)}
                        </p>
                      </Field>
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Tabs below period hours */}
        <Tabs defaultValue="summary" className="mt-1">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>

          {/* ── Summary tab ── */}
          <TabsContent value="summary" className="mt-3 space-y-4 text-sm">
            {ticket.Summary || ticket.Detail || ticket.Resolution ? (
              <>
                {ticket.Summary && <TextBlock label="Summary" text={ticket.Summary} />}
                {ticket.Detail && <TextBlock label="Detail" text={ticket.Detail} />}
                {ticket.Resolution && <TextBlock label="Resolution" text={ticket.Resolution} />}
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No summary available for this ticket.</p>
            )}
          </TabsContent>

          {/* ── Billing History tab ── */}
          <TabsContent value="billing" className="mt-3 text-sm">
            {ticket.hours_summary?.by_period && ticket.hours_summary.by_period.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Full billing history across all periods</p>
                  <span className="text-xs text-muted-foreground">
                    All-time total: <strong className="text-foreground">{Number(ticket.hours_summary.total_hours).toFixed(2)} hrs</strong>
                  </span>
                </div>
                {ticket.hours_summary.by_period.map((period) => (
                  <div key={period.period} className="overflow-hidden rounded-md border border-border">
                    <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5">
                      <span className="text-xs font-medium">
                        {period.period}
                        {period.is_current_month && (
                          <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            current
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{Number(period.billable_hours).toFixed(2)} hrs</span>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground">Technician</th>
                          <th className="hidden px-3 py-1.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Work Type</th>
                          <th className="hidden px-3 py-1.5 text-left text-xs font-medium text-muted-foreground md:table-cell">Agreement</th>
                          <th className="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground">Hrs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {period.entries.map((entry, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-1.5 text-xs">{entry.technician}</td>
                            <td className="hidden px-3 py-1.5 text-xs text-muted-foreground sm:table-cell">{entry.work_type}</td>
                            <td className="hidden px-3 py-1.5 text-xs text-muted-foreground md:table-cell">{entry.agreement}</td>
                            <td className="px-3 py-1.5 text-right text-xs font-medium">{Number(entry.billable_hours).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No billing history available for this ticket.</p>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}

// ─── Ticket detail dialog ────────────────────────────────────────────────────

export function TicketDetailDialog({ ticket, open, onClose, periodLabel }: { ticket: TicketRecord; open: boolean; onClose: () => void; periodLabel: string }) {
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
        <TicketDetailContent ticket={ticket} periodLabel={periodLabel} />
      </DialogContent>
    </Dialog>
  );
}

// ─── Table column definitions ────────────────────────────────────────────────

interface TableColDef {
  key: string;
  label: string;
  sortKey?: SortKey;
  headerClass?: string;
  cellClass?: string;
  alwaysVisible?: boolean;
  renderCell: (ticket: TicketRecord) => ReactNode;
}

const TABLE_COLUMNS: TableColDef[] = [
  {
    key: "ticket",
    label: "Ticket #",
    sortKey: "Ticket #",
    headerClass: "w-20",
    alwaysVisible: true,
    renderCell: (t) => <span className="font-mono text-xs text-muted-foreground">{t["Ticket #"]}</span>,
  },
  {
    key: "created",
    label: "Created",
    sortKey: "Created Date",
    headerClass: "w-28",
    renderCell: (t) => <span className="text-xs">{formatDate(t["Created Date"])}</span>,
  },
  {
    key: "contact",
    label: "Contact",
    sortKey: "Primary Contact",
    headerClass: "w-36",
    renderCell: (t) => <span className="text-xs">{t["Primary Contact"]}</span>,
  },
  {
    key: "board",
    label: "Board",
    sortKey: "Board",
    headerClass: "w-32",
    renderCell: (t) => <span className="text-xs">{t.Board}</span>,
  },
  {
    key: "type",
    label: "Type",
    sortKey: "Ticket Type",
    headerClass: "w-24",
    renderCell: (t) => <span className="text-xs text-muted-foreground">{t["Ticket Type"] || "—"}</span>,
  },
  {
    key: "sla",
    label: "SLA",
    sortKey: "SLA Attainment",
    headerClass: "w-24",
    renderCell: (t) => <SlaAttainmentBadge value={t["SLA Attainment"]} />,
  },
  {
    key: "slaStatus",
    label: "SLA Status",
    headerClass: "w-20",
    renderCell: (t) => <SlaStatusChip ticket={t} />,
  },
  {
    key: "techs",
    label: "Techs",
    sortKey: "Techs Worked",
    headerClass: "w-40",
    renderCell: (t) => <span className="text-xs">{t["Techs Worked"] || "—"}</span>,
  },
  {
    key: "ssa",
    label: "SSA",
    sortKey: "SSA Hours",
    headerClass: "w-16 text-right",
    cellClass: "text-right",
    renderCell: (t) => <span className="text-xs">{(t["SSA Hours"] ?? 0) > 0 ? t["SSA Hours"]!.toFixed(2) : "—"}</span>,
  },
  {
    key: "msa",
    label: "MSA",
    sortKey: "MSA Hours",
    headerClass: "w-16 text-right",
    cellClass: "text-right",
    renderCell: (t) => <span className="text-xs">{(t["MSA Hours"] ?? 0) > 0 ? t["MSA Hours"]!.toFixed(2) : "—"}</span>,
  },
  {
    key: "dedicated",
    label: "Dedicated",
    sortKey: "Dedicated Resource Hours",
    headerClass: "w-20 text-right",
    cellClass: "text-right",
    renderCell: (t) => <span className="text-xs">{(t["Dedicated Resource Hours"] ?? 0) > 0 ? t["Dedicated Resource Hours"]!.toFixed(2) : "—"}</span>,
  },
  {
    key: "agreement",
    label: "Agreement",
    sortKey: "Agreements Used",
    headerClass: "w-40",
    renderCell: (t) => <span className="text-xs">{t["Agreements Used"] || "—"}</span>,
  },
  {
    key: "wo",
    label: "W/O",
    sortKey: "Written Off / Non-Billable Hours",
    headerClass: "w-16 text-right",
    cellClass: "text-right",
    renderCell: (t) => {
      const v = t["Written Off / Non-Billable Hours"] ?? 0;
      return <span className="text-xs">{v > 0 ? v.toFixed(2) : "—"}</span>;
    },
  },
  {
    key: "total",
    label: "Total",
    sortKey: "Total Hours",
    headerClass: "w-20 text-right",
    cellClass: "text-right",
    alwaysVisible: true,
    renderCell: (t) => <span className="text-xs font-medium">{Number(t.hours_summary?.total_hours ?? t["Total Hours"] ?? 0).toFixed(2)}</span>,
  },
];

// ─── Columns toggle ───────────────────────────────────────────────────────────

function ColumnsToggle({ visible, onChange }: { visible: Set<string>; onChange: (v: Set<string>) => void }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-xs">Columns</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-48 p-1 gap-1">
        {TABLE_COLUMNS.filter((c) => !c.alwaysVisible).map((col) => {
          const checked = visible.has(col.key);
          return (
            <button
              key={col.key}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                const next = new Set(visible);
                if (checked) next.delete(col.key);
                else next.add(col.key);
                onChange(next);
              }}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  checked ? "bg-primary border-primary text-primary-foreground" : "border-input",
                )}
              >
                {checked && <Check className="h-3 w-3" />}
              </span>
              <span>{col.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

// placeholder — replaced below
interface ReportTicketsTableProps {
  tickets: TicketRecord[];
  total: number;
  periodLabel: string;
}

export default function ReportTicketsTable({ tickets, periodLabel }: ReportTicketsTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | "open" | "closed">("all");
  const [sortKey, setSortKey] = useState<SortKey>("Ticket #");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchColumn, setSearchColumn] = useState<ColumnDef>(SEARCHABLE_COLUMNS[0]);
  const [searchValue, setSearchValue] = useState("");
  const [searchDate, setSearchDate] = useState<DateRange | undefined>();
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => new Set(TABLE_COLUMNS.map((c) => c.key)));
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openTickets = useMemo(() => tickets.filter((t) => t.Closed_Flag === 0), [tickets]);
  const closedTickets = useMemo(() => tickets.filter((t) => t.Closed_Flag === 1), [tickets]);

  const tabTickets = useMemo(() => {
    if (activeTab === "open") return openTickets;
    if (activeTab === "closed") return closedTickets;
    return tickets;
  }, [activeTab, tickets, openTickets, closedTickets]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    if (searchColumn.searchType === "date") {
      if (!searchDate?.from) return tabTickets;
      return tabTickets.filter((t) => {
        const raw = searchColumn.getValue(t);
        if (!raw) return false;
        try {
          const d = parseISO(raw);
          const from = startOfDay(searchDate.from!);
          const to = endOfDay(searchDate.to ?? searchDate.from!);
          return isWithinInterval(d, { start: from, end: to });
        } catch {
          return false;
        }
      });
    }
    if (!searchValue.trim()) return tabTickets;
    const q = searchValue.toLowerCase();
    if (searchColumn.searchType === "combobox") {
      return tabTickets.filter((t) => searchColumn.getValue(t).toLowerCase().includes(q));
    }
    return tabTickets.filter((t) => searchColumn.getValue(t).toLowerCase().includes(q));
  }, [tabTickets, searchColumn, searchValue, searchDate]);

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

  const visibleCols = TABLE_COLUMNS.filter((c) => visibleColumns.has(c.key));

  function handleExportCsv() {
    const safePeriod = periodLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    exportTicketsToCsv(sorted, `service-summary-report-${safePeriod || "export"}.csv`);
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <TabsList className="mb-2">
              <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
              <TabsTrigger value="open">Open &amp; In Progress ({openTickets.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closedTickets.length})</TabsTrigger>
            </TabsList>
            <SmartSearchBar
              data={tabTickets}
              searchColumn={searchColumn}
              setSearchColumn={(col) => {
                setSearchColumn(col);
                setSearchValue("");
                setSearchDate(undefined);
              }}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              searchDate={searchDate}
              setSearchDate={setSearchDate}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={handleExportCsv} disabled={sorted.length === 0}>
              <Download className="h-3.5 w-3.5" />
              <span className="text-xs">Export CSV</span>
            </Button>
            <ColumnsToggle visible={visibleColumns} onChange={setVisibleColumns} />
          </div>
        </div>

        {/* Hours summary */}
        <div className="border-b border-border px-4 py-2.5">
          <HoursSummaryBar tickets={tabTickets} />
        </div>

        {/* Table */}
        {sorted.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No tickets found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {visibleCols.map((col) =>
                    col.sortKey ? (
                      <SortableHeader
                        key={col.key}
                        label={col.label}
                        sortKey={col.sortKey}
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onSort={handleSort}
                        className={col.headerClass}
                      />
                    ) : (
                      <TableHead key={col.key} className={cn("text-xs", col.headerClass)}>
                        {col.label}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((ticket, idx) => (
                  <TableRow
                    key={`${ticket["Ticket #"]}-${idx}`}
                    className="cursor-pointer border-border transition-colors hover:bg-secondary/40"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setDialogOpen(true);
                    }}
                  >
                    {visibleCols.map((col) => (
                      <TableCell key={col.key} className={cn("text-xs", col.cellClass)}>
                        {col.renderCell(ticket)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {selectedTicket && <TicketDetailDialog ticket={selectedTicket} open={dialogOpen} onClose={() => setDialogOpen(false)} periodLabel={periodLabel} />}
    </Tabs>
  );
}
