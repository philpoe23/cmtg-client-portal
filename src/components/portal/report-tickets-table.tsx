"use client";

import type { ReactNode } from "react";
import { useState, useMemo, useEffect } from "react";
import { type DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { ChevronUp, ChevronDown, ChevronRight, ChevronsUpDown, CornerDownRight, Download, MapPin, Search, SlidersHorizontal, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadXlsx, type XlsxColumnType } from "@/lib/api/xlsx";
import { track } from "@/lib/analytics";
import ReportOverview from "@/components/portal/report-overview";
import type { HourType, TicketRecord } from "@/types";

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
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="rounded-r-none border-r-0 gap-1 px-2.5 shrink-0 h-9">
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs max-w-20 truncate">{searchColumn.header}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-44 p-1 gap-1">
          {SEARCHABLE_COLUMNS.map((col) => (
            <button
              key={col.key}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-sm hover:bg-accent ${searchColumn.key === col.key ? "bg-accent font-medium" : ""}`}
              onClick={() => {
                setSearchColumn(col);
                setSearchValue("");
                setSearchDate(undefined);
                track("report_search_column", { column: col.header });
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

/** Child tickets don't carry their own SLA -- it's governed by the parent ticket. */
export function isChildTicket(ticket: TicketRecord): boolean {
  return ticket["Parent Ticket #"] != null;
}

function ParentSlaNote({ ticket }: { ticket: TicketRecord }) {
  return <span className="text-xs text-muted-foreground">Parent #{ticket["Parent Ticket #"]}</span>;
}

function getSlaMetCount(ticket: TicketRecord): number {
  return [ticket["SLA Response"], ticket["SLA Plan"], ticket["SLA Resolution"]].filter((v) => v === "Met").length;
}

function getSlaVariant(count: number): "resolved" | "progress" | "pending" | "critical" {
  if (count === 3) return "resolved";
  if (count === 2) return "progress";
  if (count === 1) return "pending";
  return "critical";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SlaAttainmentBadge({ value }: { value: string }) {
  const cls =
    value === "Met"
      ? "bg-cmtg-status-resolved-bg text-cmtg-status-resolved-fg"
      : value === "Missed"
        ? "bg-cmtg-status-critical-bg text-cmtg-status-critical-fg"
        : "bg-cmtg-status-pending-bg text-cmtg-status-pending-fg";
  return (
    <Badge className={cls}>
      {value}
    </Badge>
  );
}

function SlaSubBadge({ value }: { value: string }) {
  const cls =
    value === "Met"
      ? "bg-cmtg-status-resolved-bg text-cmtg-status-resolved-fg"
      : value === "Not Met"
        ? "bg-cmtg-status-critical-bg text-cmtg-status-critical-fg"
        : "bg-cmtg-status-pending-bg text-cmtg-status-pending-fg";
  return (
    <Badge className={cls}>
      {value || "—"}
    </Badge>
  );
}

function StatusChip({ closed }: { closed: boolean }) {
  return (
    <Badge variant={closed ? "resolved" : "info"}>
      {closed ? "Closed" : "Open"}
    </Badge>
  );
}

export function PriorityChip({ value }: { value: string }) {
  const cls =
    value === "Critical"
      ? "bg-cmtg-status-critical-bg text-cmtg-status-critical-fg"
      : value === "High"
        ? "bg-cmtg-status-pending-bg text-cmtg-status-pending-fg"
        : value === "Medium"
          ? "bg-cmtg-status-progress-bg text-cmtg-status-progress-fg"
          : "bg-cmtg-status-neutral-bg text-cmtg-status-neutral-fg";
  return (
    <Badge className={cls}>
      {value || "—"}
    </Badge>
  );
}

// Technician chips rotate through the CMTG brand hues so names stay distinguishable.
const TECH_COLORS = [
  "bg-cmtg-forest/10 text-cmtg-forest dark:bg-cmtg-blue-green/16 dark:text-[#8FDAD9]",
  "bg-cmtg-bright-green/12 text-[#057a5c] dark:bg-cmtg-bright-green/24 dark:text-[#57E0B4]",
  "bg-cmtg-amber/14 text-[#8a6620] dark:bg-cmtg-amber/22 dark:text-[#E9C169]",
  "bg-cmtg-blue-green/16 text-[#2f7c7b] dark:bg-cmtg-blue-green/22 dark:text-[#8FDAD9]",
  "bg-cmtg-light-green/20 text-[#2f6b59] dark:bg-cmtg-light-green/20 dark:text-[#A9DCCB]",
  "bg-cmtg-brick/12 text-[#a63c31] dark:bg-cmtg-brick/22 dark:text-[#F0958A]",
  "bg-cmtg-ink/8 text-cmtg-ink dark:bg-white/10 dark:text-[#D7E4E1]",
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
        <Badge key={tech} className={TECH_COLORS[techColorIndex(tech)]}>
          {tech}
        </Badge>
      ))}
    </div>
  );
}

function SiteChip({ value }: { value: string }) {
  if (!value) return <span className="text-sm font-medium">—</span>;
  return (
    <Badge variant="neutral" className="gap-1">
      <MapPin className="size-3" />
      {value}
    </Badge>
  );
}

function SlaStatusChip({ ticket }: { ticket: TicketRecord }) {
  const count = getSlaMetCount(ticket);
  const variant = getSlaVariant(count);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={variant} className="cursor-default select-none">
            {count} met
          </Badge>
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

// ─── Hour type ───────────────────────────────────────────────────────────────

type AgreementBucket = "ssa" | "msa" | "dedicated" | "noAgreement";

function agreementBucket(agreement: string | null | undefined): AgreementBucket {
  const ag = (agreement ?? "").toLowerCase();
  if (ag.includes("ssa")) return "ssa";
  if (ag.includes("msa")) return "msa";
  if (ag.includes("dedicated")) return "dedicated";
  return "noAgreement";
}

/**
 * The report API's hour fields are invoice (billable) hours. For accounts set
 * to actual hours (and MSA on-site tickets on any account), rebuild them from each time entry's `actual_hours` — every
 * hour an engineer logged, billable or not — so the table, sorting, totals,
 * export and detail dialog all read the same fields in either mode.
 * Period fields come from the `by_period` entries matching `periodLabel`.
 */
function toActualHours(ticket: TicketRecord, periodLabel: string): TicketRecord {
  const summary = ticket.hours_summary;
  if (!summary) return ticket;

  const byPeriod = (summary.by_period ?? []).map((period) => ({
    ...period,
    billable_hours: period.actual_hours,
    non_billable_hours: "0",
    entries: period.entries.map((entry) => ({ ...entry, billable_hours: entry.actual_hours, non_billable_hours: "0" })),
  }));

  const inPeriod = { ssa: 0, msa: 0, dedicated: 0, noAgreement: 0 };
  for (const period of byPeriod) {
    if (period.period !== periodLabel) continue;
    for (const entry of period.entries) inPeriod[agreementBucket(entry.agreement)] += Number(entry.actual_hours) || 0;
  }
  const allTime = byPeriod.reduce((s, p) => s + (Number(p.actual_hours) || 0), 0);

  return {
    ...ticket,
    "SSA Hours": inPeriod.ssa,
    "MSA Hours": inPeriod.msa,
    "Dedicated Resource Hours": inPeriod.dedicated,
    "No Agreement Hours": inPeriod.noAgreement,
    "Written Off / Non-Billable Hours": 0,
    "Total Hours": inPeriod.ssa + inPeriod.msa + inPeriod.dedicated + inPeriod.noAgreement,
    hours_summary: { ...summary, total_hours: allTime.toFixed(2), by_period: byPeriod },
  };
}

// Matches "13 - On-site Business Hours", "14 - Already Onsite", "32 - After Hours Onsite".
const ONSITE_WORK_TYPE = /on-?\s?site/i;

/** MSA tickets with on-site work always show actual hours, whatever the account's hour type. */
function isMsaOnsite(ticket: TicketRecord): boolean {
  return (ticket.hours_summary?.by_period ?? []).some((period) =>
    period.entries.some((entry) => agreementBucket(entry.agreement) === "msa" && ONSITE_WORK_TYPE.test(entry.work_type ?? "")),
  );
}

function effectiveHourType(ticket: TicketRecord, hourType: HourType): HourType {
  return hourType === "actual_hours" || isMsaOnsite(ticket) ? "actual_hours" : "invoice_hours";
}

function HoursSummaryBar({ tickets, hourType }: { tickets: TicketRecord[]; hourType: HourType }) {
  const ssa = tickets.reduce((s, t) => s + (t["SSA Hours"] ?? 0), 0);
  const msa = tickets.reduce((s, t) => s + (t["MSA Hours"] ?? 0), 0);
  const dedicated = tickets.reduce((s, t) => s + (t["Dedicated Resource Hours"] ?? 0), 0);
  const noAgreement = tickets.reduce((s, t) => s + (t["No Agreement Hours"] ?? 0), 0);
  const total = tickets.reduce((s, t) => s + (t["Total Hours"] ?? 0), 0);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {hourType === "actual_hours" ? "Actual hours" : "Invoiced hours · MSA on-site actual"}
      </span>
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

// ─── Excel export ──────────────────────────────────────────────────────────

/** The generator expects plain `YYYY-MM-DD`; avoid UTC conversion shifting the day. */
function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (iso) return iso[1];
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

function TextSection({ value, label, text }: { value: string; label: string; text: string }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-xs uppercase tracking-wide text-muted-foreground hover:no-underline">{label}</AccordionTrigger>
      <AccordionContent>
        <p className="whitespace-pre-wrap text-sm">{text}</p>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Ticket detail content (shared by the dialog and any inline panel) ───────

export function TicketDetailContent({
  ticket: rawTicket,
  periodLabel,
  hourType = "invoice_hours",
}: {
  ticket: TicketRecord;
  periodLabel: string;
  hourType?: HourType;
}) {
  const ticketHourType = effectiveHourType(rawTicket, hourType);
  // toActualHours is idempotent, so tickets already converted by the table pass through unchanged.
  const ticket = ticketHourType === "actual_hours" ? toActualHours(rawTicket, periodLabel) : rawTicket;
  // Actual hours already include non-billable time, so there's nothing "written off" to show.
  const showWrittenOff = ticketHourType === "invoice_hours";
  const hasText = Boolean(ticket.Summary || ticket.Detail || ticket.Resolution);
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
          {hourType === "invoice_hours" && ticketHourType === "actual_hours" && (
            <Badge variant="outline" className="text-xs font-normal">
              MSA on-site · actual hours
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
            {isChildTicket(ticket) ? (
              <p className="text-sm text-muted-foreground">
                Governed by parent ticket <span className="font-medium text-foreground">#{ticket["Parent Ticket #"]}</span>.
              </p>
            ) : (
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
            )}
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
              {showWrittenOff && (
                <Field label="Written Off">
                  {(() => {
                    const v = ticket["Written Off / Non-Billable Hours"] ?? 0;
                    return <p className={v > 0 ? "font-bold text-cmtg-status-pending-fg" : "font-medium"}>{v.toFixed(2)}</p>;
                  })()}
                </Field>
              )}
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
                  const hours = { ssa: 0, msa: 0, dedicated: 0, noAgreement: 0 };
                  let writtenOff = 0;
                  for (const period of ticket.hours_summary!.by_period ?? []) {
                    for (const entry of period.entries) {
                      writtenOff += Number(entry.non_billable_hours) || 0;
                      hours[agreementBucket(entry.agreement)] += Number(entry.billable_hours) || 0;
                    }
                  }
                  const total = Number(ticket.hours_summary!.total_hours) || 0;
                  return (
                    <>
                      <Field label="SSA" value={hours.ssa.toFixed(2)} />
                      <Field label="MSA" value={hours.msa.toFixed(2)} />
                      <Field label="Dedicated" value={hours.dedicated.toFixed(2)} />
                      <Field label="No Agreement" value={hours.noAgreement.toFixed(2)} />
                      {showWrittenOff && (
                        <Field label="Written Off">
                          <p
                            className={writtenOff > 0 ? "font-bold text-cmtg-status-pending-fg" : "font-medium"}
                                                      >
                            {writtenOff.toFixed(2)}
                          </p>
                        </Field>
                      )}
                      <Field label="Total">
                        <p className="font-semibold text-primary">
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
        <Tabs defaultValue="summary" className="mt-1" onValueChange={(tab) => track("ticket_tab_view", { ticket_id: ticket["Ticket #"], tab: String(tab) })}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="billing">{showWrittenOff ? "Billing History" : "Hours History"}</TabsTrigger>
          </TabsList>

          {/* ── Summary tab ── */}
          <TabsContent value="summary" className="mt-3 text-sm">
            {hasText ? (
              <Accordion multiple defaultValue={["summary"]} className="rounded-md border border-border px-3">
                {ticket.Summary && <TextSection value="summary" label="Summary" text={ticket.Summary} />}
                {ticket.Detail && <TextSection value="detail" label="Detail" text={ticket.Detail} />}
                {ticket.Resolution && <TextSection value="resolution" label="Resolution" text={ticket.Resolution} />}
              </Accordion>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No summary available for this ticket.</p>
            )}
          </TabsContent>

          {/* ── Billing History tab ── */}
          <TabsContent value="billing" className="mt-3 text-sm">
            {ticket.hours_summary?.by_period && ticket.hours_summary.by_period.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {showWrittenOff ? "Full billing history across all periods" : "All hours logged across all periods"}
                  </p>
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
                          <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-cmtg-status-info-bg text-cmtg-status-info-fg">
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
              <p className="py-8 text-center text-sm text-muted-foreground">
                {showWrittenOff ? "No billing history available for this ticket." : "No hours logged for this ticket."}
              </p>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}

// ─── Ticket detail dialog ────────────────────────────────────────────────────

export function TicketDetailDialog({
  ticket,
  open,
  onClose,
  periodLabel,
  hourType,
  source,
}: {
  ticket: TicketRecord;
  open: boolean;
  onClose: () => void;
  periodLabel: string;
  hourType?: HourType;
  /** Where the dialog was opened from, for analytics. */
  source: string;
}) {
  const ticketId = ticket["Ticket #"];

  // One ticket_open per opening, and a ticket_close with how long it was viewed.
  useEffect(() => {
    if (!open) return;
    const openedAt = Date.now();
    track("ticket_open", {
      ticket_id: ticketId,
      summary: ticket.Summary,
      status: ticket.Closed_Flag === 1 ? "closed" : "open",
      priority: ticket["SLA Priority"],
      source,
      period: periodLabel,
    });
    return () => track("ticket_close", { ticket_id: ticketId, source, seconds_viewed: Math.round((Date.now() - openedAt) / 1000) });
    // Only re-fire when a different ticket is opened, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticketId]);

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
        <TicketDetailContent ticket={ticket} periodLabel={periodLabel} hourType={hourType} />
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
  /** Export metadata — kept beside renderCell so the workbook can't drift from the table. */
  exportType: XlsxColumnType;
  exportValue: (ticket: TicketRecord) => string | number | null;
  exportWidth?: number;
  exportAlign?: "left" | "center" | "right";
  exportTotal?: boolean;
}

const TABLE_COLUMNS: TableColDef[] = [
  {
    key: "ticket",
    label: "Ticket #",
    sortKey: "Ticket #",
    headerClass: "w-20",
    alwaysVisible: true,
    renderCell: (t) => <span className="font-mono text-xs text-muted-foreground">{t["Ticket #"]}</span>,
    exportType: "number",
    exportValue: (t) => t["Ticket #"],
    exportWidth: 12,
    exportAlign: "center",
  },
  {
    key: "created",
    label: "Created",
    sortKey: "Created Date",
    headerClass: "w-28",
    renderCell: (t) => <span className="text-xs">{formatDate(t["Created Date"])}</span>,
    exportType: "date",
    exportValue: (t) => toIsoDate(t["Created Date"]),
  },
  {
    key: "contact",
    label: "Contact",
    sortKey: "Primary Contact",
    headerClass: "w-36",
    renderCell: (t) => <span className="text-xs">{t["Primary Contact"]}</span>,
    exportType: "text",
    exportValue: (t) => t["Primary Contact"],
    exportWidth: 24,
  },
  {
    key: "site",
    label: "Site",
    sortKey: "Site",
    headerClass: "w-40",
    renderCell: (t) => <span className="text-xs">{t.Site || "—"}</span>,
    exportType: "text",
    exportValue: (t) => t.Site,
    exportWidth: 28,
  },
  {
    key: "board",
    label: "Board",
    sortKey: "Board",
    headerClass: "w-32",
    renderCell: (t) => <span className="text-xs">{t.Board}</span>,
    exportType: "text",
    exportValue: (t) => t.Board,
    exportWidth: 20,
  },
  {
    key: "type",
    label: "Type",
    sortKey: "Ticket Type",
    headerClass: "w-24",
    renderCell: (t) => <span className="text-xs text-muted-foreground">{t["Ticket Type"] || "—"}</span>,
    exportType: "text",
    exportValue: (t) => t["Ticket Type"],
    exportWidth: 18,
  },
  {
    key: "sla",
    label: "SLA",
    sortKey: "SLA Attainment",
    headerClass: "w-24",
    renderCell: (t) => (isChildTicket(t) ? <ParentSlaNote ticket={t} /> : <SlaAttainmentBadge value={t["SLA Attainment"]} />),
    exportType: "text",
    exportValue: (t) => (isChildTicket(t) ? `Parent #${t["Parent Ticket #"]}` : t["SLA Attainment"]),
    exportWidth: 14,
  },
  {
    key: "slaStatus",
    label: "SLA Status",
    headerClass: "w-20",
    renderCell: (t) => (isChildTicket(t) ? <span className="text-xs text-muted-foreground">—</span> : <SlaStatusChip ticket={t} />),
    exportType: "text",
    exportValue: (t) => (isChildTicket(t) ? null : `${getSlaMetCount(t)} met`),
    exportWidth: 12,
    exportAlign: "center",
  },
  {
    key: "techs",
    label: "Techs",
    sortKey: "Techs Worked",
    headerClass: "w-40",
    renderCell: (t) => <span className="text-xs">{t["Techs Worked"] || "—"}</span>,
    exportType: "text",
    exportValue: (t) => t["Techs Worked"],
    exportWidth: 32,
  },
  {
    key: "ssa",
    label: "SSA",
    sortKey: "SSA Hours",
    headerClass: "w-16 text-right",
    cellClass: "text-right",
    renderCell: (t) => <span className="text-xs">{(t["SSA Hours"] ?? 0) > 0 ? t["SSA Hours"]!.toFixed(2) : "—"}</span>,
    exportType: "hours",
    exportValue: (t) => t["SSA Hours"] ?? 0,
    exportTotal: true,
  },
  {
    key: "msa",
    label: "MSA",
    sortKey: "MSA Hours",
    headerClass: "w-16 text-right",
    cellClass: "text-right",
    renderCell: (t) => <span className="text-xs">{(t["MSA Hours"] ?? 0) > 0 ? t["MSA Hours"]!.toFixed(2) : "—"}</span>,
    exportType: "hours",
    exportValue: (t) => t["MSA Hours"] ?? 0,
    exportTotal: true,
  },
  {
    key: "dedicated",
    label: "Dedicated",
    sortKey: "Dedicated Resource Hours",
    headerClass: "w-20 text-right",
    cellClass: "text-right",
    renderCell: (t) => <span className="text-xs">{(t["Dedicated Resource Hours"] ?? 0) > 0 ? t["Dedicated Resource Hours"]!.toFixed(2) : "—"}</span>,
    exportType: "hours",
    exportValue: (t) => t["Dedicated Resource Hours"] ?? 0,
    exportTotal: true,
  },
  {
    key: "agreement",
    label: "Agreement",
    sortKey: "Agreements Used",
    headerClass: "w-40",
    renderCell: (t) => <span className="text-xs">{t["Agreements Used"] || "—"}</span>,
    exportType: "text",
    exportValue: (t) => t["Agreements Used"],
    exportWidth: 32,
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
    exportType: "hours",
    exportValue: (t) => t["Written Off / Non-Billable Hours"] ?? 0,
    exportTotal: true,
  },
  {
    key: "total",
    label: "Total",
    sortKey: "Total Hours",
    headerClass: "w-20 text-right",
    cellClass: "text-right",
    alwaysVisible: true,
    renderCell: (t) => <span className="text-xs font-medium">{Number(t.hours_summary?.total_hours ?? t["Total Hours"] ?? 0).toFixed(2)}</span>,
    exportType: "hours",
    exportValue: (t) => Number(t.hours_summary?.total_hours ?? t["Total Hours"] ?? 0),
    exportTotal: true,
  },
];

// ─── Columns toggle ───────────────────────────────────────────────────────────

function ColumnsToggle({ columns, visible, onChange }: { columns: TableColDef[]; visible: Set<string>; onChange: (v: Set<string>) => void }) {
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
        {columns.filter((c) => !c.alwaysVisible).map((col) => {
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
                track("report_column_toggle", { column: col.label, visible: !checked });
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
  companyName?: string | null;
  hourType?: HourType;
}

export default function ReportTicketsTable({ tickets: rawTickets, periodLabel, companyName, hourType = "invoice_hours" }: ReportTicketsTableProps) {
  const tickets = useMemo(
    () => rawTickets.map((t) => (effectiveHourType(t, hourType) === "actual_hours" ? toActualHours(t, periodLabel) : t)),
    [rawTickets, hourType, periodLabel],
  );
  // Written-off hours only mean something against invoiced hours.
  const columns = useMemo(() => (hourType === "actual_hours" ? TABLE_COLUMNS.filter((c) => c.key !== "wo") : TABLE_COLUMNS), [hourType]);
  const [activeTab, setActiveTab] = useState<"all" | "open" | "closed">("all");
  const [sortKey, setSortKey] = useState<SortKey>("Ticket #");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchColumn, setSearchColumn] = useState<ColumnDef>(SEARCHABLE_COLUMNS[0]);
  const [searchValue, setSearchValue] = useState("");
  const [searchDate, setSearchDate] = useState<DateRange | undefined>();
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => new Set(TABLE_COLUMNS.map((c) => c.key)));
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const openTickets = useMemo(() => tickets.filter((t) => t.Closed_Flag === 0), [tickets]);
  const closedTickets = useMemo(() => tickets.filter((t) => t.Closed_Flag === 1), [tickets]);

  const tabTickets = useMemo(() => {
    if (activeTab === "open") return openTickets;
    if (activeTab === "closed") return closedTickets;
    return tickets;
  }, [activeTab, tickets, openTickets, closedTickets]);

  function handleSort(key: SortKey) {
    const dir: SortDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(dir);
    track("report_sort", { column: String(key), direction: dir });
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

  // Nest child tickets under their parent when the parent is in the same result
  // set. A child whose parent fell outside the period or the current filter stays
  // top-level so it isn't hidden. Each group keeps the table's sort order.
  const { topLevel, childrenOf } = useMemo(() => {
    const ids = new Set(sorted.map((t) => t["Ticket #"]));
    const childrenOf = new Map<number, TicketRecord[]>();
    const topLevel: TicketRecord[] = [];
    for (const t of sorted) {
      const parent = t["Parent Ticket #"];
      if (parent != null && parent !== t["Ticket #"] && ids.has(parent)) {
        const list = childrenOf.get(parent);
        if (list) list.push(t);
        else childrenOf.set(parent, [t]);
      } else {
        topLevel.push(t);
      }
    }
    return { topLevel, childrenOf };
  }, [sorted]);

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  function toggleExpanded(ticketId: number) {
    const next = new Set(expanded);
    const opening = !next.has(ticketId);
    if (opening) next.add(ticketId);
    else next.delete(ticketId);
    setExpanded(next);
    track("report_child_tickets_toggle", { ticket_id: ticketId, expanded: opening });
  }

  /** Parents followed by their children: the order rows appear in the table when fully expanded. */
  const groupedRows = useMemo(() => {
    const rows: { ticket: TicketRecord; depth: number }[] = [];
    const visit = (t: TicketRecord, depth: number) => {
      rows.push({ ticket: t, depth });
      for (const child of childrenOf.get(t["Ticket #"]) ?? []) visit(child, depth + 1);
    };
    topLevel.forEach((t) => visit(t, 0));
    return rows;
  }, [topLevel, childrenOf]);

  const visibleCols = columns.filter((c) => visibleColumns.has(c.key));

  // Record what people search for once they stop typing, not every keystroke.
  useEffect(() => {
    if (!searchValue.trim() && !searchDate?.from) return;
    const timer = setTimeout(() => {
      track("report_search", {
        column: searchColumn.header,
        value: searchValue.trim() || undefined,
        from: searchDate?.from?.toISOString().slice(0, 10),
        to: searchDate?.to?.toISOString().slice(0, 10),
        results: filtered.length,
      });
    }, 1000);
    return () => clearTimeout(timer);
    // filtered is derived from these; leaving it out avoids re-firing when tickets reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, searchDate, searchColumn]);

  async function handleExport() {
    const safePeriod = periodLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const safeCompany = (companyName ?? "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const tabLabel = activeTab === "open" ? "Open & In Progress" : activeTab === "closed" ? "Closed" : null;

    setExporting(true);
    try {
      await downloadXlsx({
        title: "Service Tickets",
        subtitle: [companyName, periodLabel, tabLabel].filter(Boolean).join(" — "),
        sheet_name: "Tickets",
        filename: [safeCompany, "service-tickets", safePeriod].filter(Boolean).join("-") || "service-tickets",
        columns: visibleCols.map((c) => ({
          key: c.key,
          label: c.label,
          type: c.exportType,
          ...(c.exportWidth ? { width: c.exportWidth } : {}),
          ...(c.exportAlign ? { align: c.exportAlign } : {}),
          ...(c.exportTotal ? { total: true } : {}),
        })),
        rows: groupedRows.map(({ ticket: t }) => Object.fromEntries(visibleCols.map((c) => [c.key, c.exportValue(t)]))),
      });
      track("excel_export", {
        company: companyName,
        period: periodLabel,
        tab: tabLabel ?? "All",
        rows: sorted.length,
        columns: visibleCols.map((c) => c.label).join(", "),
        search_column: searchValue || searchDate?.from ? searchColumn.header : undefined,
        search_value: searchValue || undefined,
      });
    } catch (err) {
      track("excel_export_failed", { company: companyName, period: periodLabel, error: err instanceof Error ? err.message : String(err) });
      toast.error(err instanceof Error ? err.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
    <ReportOverview tickets={tickets} periodLabel={periodLabel} hourType={hourType} />
    <Tabs
      className="min-w-0"
      value={activeTab}
      onValueChange={(v) => {
        setActiveTab(v as typeof activeTab);
        track("report_tab_change", { tab: String(v) });
      }}
    >
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
            <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={handleExport} disabled={sorted.length === 0 || exporting}>
              <Download className="h-3.5 w-3.5" />
              <span className="text-xs">{exporting ? "Exporting…" : "Export Excel"}</span>
            </Button>
            <ColumnsToggle columns={columns} visible={visibleColumns} onChange={setVisibleColumns} />
          </div>
        </div>

        {/* Hours summary */}
        <div className="border-b border-border px-4 py-2.5">
          <HoursSummaryBar tickets={tabTickets} hourType={hourType} />
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
                {(function renderRows(list: TicketRecord[], depth: number): ReactNode[] {
                  return list.flatMap((ticket, idx) => {
                    const id = ticket["Ticket #"];
                    const children = childrenOf.get(id) ?? [];
                    const isOpen = expanded.has(id);
                    const row = (
                      <TableRow
                        key={`${id}-${depth}-${idx}`}
                        className={cn("cursor-pointer border-border transition-colors hover:bg-secondary/40", depth > 0 && "bg-muted/30")}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setDialogOpen(true);
                        }}
                      >
                        {visibleCols.map((col, colIdx) => (
                          <TableCell key={col.key} className={cn("text-xs", col.cellClass)}>
                            {colIdx === 0 ? (
                              <span className="inline-flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
                                {children.length > 0 ? (
                                  <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-label={`${isOpen ? "Hide" : "Show"} ${children.length} child ticket${children.length === 1 ? "" : "s"} of #${id}`}
                                    className="-ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded(id);
                                    }}
                                  >
                                    <ChevronRight className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-90")} />
                                  </button>
                                ) : depth > 0 ? (
                                  <CornerDownRight className="size-3 text-muted-foreground/60" aria-hidden />
                                ) : null}
                                {col.renderCell(ticket)}
                                {children.length > 0 && (
                                  <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground" aria-hidden>
                                    +{children.length}
                                  </span>
                                )}
                              </span>
                            ) : (
                              col.renderCell(ticket)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                    return isOpen ? [row, ...renderRows(children, depth + 1)] : [row];
                  });
                })(topLevel, 0)}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {selectedTicket && <TicketDetailDialog ticket={selectedTicket} open={dialogOpen} onClose={() => setDialogOpen(false)} periodLabel={periodLabel} hourType={hourType} source="service_summary_report" />}
    </Tabs>
    </div>
  );
}
