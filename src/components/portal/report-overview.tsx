"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { slaExclusion } from "@/lib/report-rules";
import type { HourType, TicketRecord } from "@/types";

// ─── Calculations ────────────────────────────────────────────────────────────

interface Rate {
  met: number;
  /** Tickets with a decided outcome (met + missed). Pending ones are left out. */
  decided: number;
}

function rate(met: number, decided: number): number | null {
  return decided > 0 ? (met / decided) * 100 : null;
}

function formatPct(value: number | null): string {
  if (value === null) return "—";
  // One decimal only where rounding would claim a perfect or zero score that isn't.
  const rounded = Math.round(value);
  if ((rounded === 100 && value < 100) || (rounded === 0 && value > 0)) return `${value.toFixed(1)}%`;
  return `${rounded}%`;
}

function formatHours(value: number): string {
  return value.toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function summarise(tickets: TicketRecord[]) {
  // Child tickets inherit their parent's SLA, so counting them would double-count it.
  // Tickets with no time logged had no work done against the SLA.
  const excluded = { child: 0, no_time: 0 };
  const slaTickets = tickets.filter((t) => {
    const reason = slaExclusion(t);
    if (reason) excluded[reason]++;
    return reason === null;
  });

  const attainment = { met: 0, missed: 0, pending: 0 };
  for (const t of slaTickets) {
    if (t["SLA Attainment"] === "Met") attainment.met++;
    else if (t["SLA Attainment"] === "Missed") attainment.missed++;
    else attainment.pending++;
  }

  const target = (key: "SLA Response" | "SLA Plan" | "SLA Resolution"): Rate => {
    let met = 0;
    let decided = 0;
    for (const t of slaTickets) {
      if (t[key] === "Met") met++;
      if (t[key] === "Met" || t[key] === "Not Met") decided++;
    }
    return { met, decided };
  };

  const sum = (key: "SSA Hours" | "MSA Hours" | "Dedicated Resource Hours" | "No Agreement Hours" | "Written Off / Non-Billable Hours" | "Total Hours") =>
    tickets.reduce((s, t) => s + (t[key] ?? 0), 0);

  return {
    total: tickets.length,
    open: tickets.filter((t) => t.Closed_Flag === 0).length,
    closed: tickets.filter((t) => t.Closed_Flag === 1).length,
    children: tickets.filter((t) => t["Parent Ticket #"] != null).length,
    excluded,
    attainment,
    targets: [
      { label: "Response", ...target("SLA Response") },
      { label: "Plan", ...target("SLA Plan") },
      { label: "Resolution", ...target("SLA Resolution") },
    ],
    hours: {
      ssa: sum("SSA Hours"),
      msa: sum("MSA Hours"),
      dedicated: sum("Dedicated Resource Hours"),
      noAgreement: sum("No Agreement Hours"),
      writtenOff: sum("Written Off / Non-Billable Hours"),
      total: sum("Total Hours"),
    },
  };
}

// ─── Stacked bar ─────────────────────────────────────────────────────────────

interface Segment {
  key: string;
  label: string;
  value: number;
  /** Tailwind background class for the mark. */
  fill: string;
  detail: string;
}

/**
 * A part-to-whole bar. Segments are separated by a 2px surface gap and only the
 * outer ends are rounded; each segment owns a taller hit area for its tooltip.
 */
function StackedBar({ segments, label, className }: { segments: Segment[]; label: string; className?: string }) {
  const shown = segments.filter((s) => s.value > 0);
  if (shown.length === 0) return <div className={cn("h-2.5 rounded-full bg-muted", className)} role="img" aria-label={`${label}: no data`} />;
  return (
    <div className={cn("flex gap-[2px]", className)} role="img" aria-label={`${label}: ${shown.map((s) => `${s.label} ${s.detail}`).join(", ")}`}>
      {shown.map((s, i) => (
        <Tooltip key={s.key}>
          <TooltipTrigger render={<div className="-my-2 min-w-1 py-2" style={{ flex: `${s.value} 1 0%` }} aria-hidden />}>
            <div className={cn("h-2.5 transition-opacity hover:opacity-80", s.fill, i === 0 && "rounded-l-full", i === shown.length - 1 && "rounded-r-full")} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <span className="font-medium">{s.label}</span>
            <span className="tabular-nums opacity-80">{s.detail}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ─── Panels ──────────────────────────────────────────────────────────────────

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function SlaExclusionNote({ excluded }: { excluded: { child: number; no_time: number } }) {
  const parts = [
    excluded.child > 0 && `${plural(excluded.child, "child ticket", "child tickets")}, whose SLA is governed by the parent`,
    excluded.no_time > 0 && `${plural(excluded.no_time, "ticket", "tickets")} with no time logged`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className="text-xs text-muted-foreground">Excludes {parts.join(", and ")}.</p>;
}

function SlaPanel({ data }: { data: ReturnType<typeof summarise> }) {
  const { met, missed, pending } = data.attainment;
  const decided = met + missed;
  const pct = rate(met, decided);

  return (
    <section aria-labelledby="overview-sla" className="flex flex-col gap-5 p-5 sm:p-6">
      <h2 id="overview-sla" className="font-heading text-sm font-semibold text-foreground">
        SLA attainment
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <p className="font-heading text-cmtg-display font-semibold tracking-tight tabular-nums text-foreground">{formatPct(pct)}</p>
          <p className="text-sm text-muted-foreground">
            {decided > 0 ? (
              <>
                <span className="font-medium text-foreground tabular-nums">{met}</span> of <span className="tabular-nums">{decided}</span> met
              </>
            ) : (
              "No SLA outcomes yet"
            )}
          </p>
        </div>

        <StackedBar
          label="SLA outcomes"
          segments={[
            {
              key: "met",
              label: "Met",
              value: met,
              fill: "bg-cmtg-bright-green dark:bg-cmtg-status-resolved-fg",
              detail: `${met} tickets`,
            },
            {
              key: "missed",
              label: "Missed",
              value: missed,
              fill: "bg-cmtg-brick dark:bg-cmtg-status-critical-fg",
              detail: `${missed} tickets`,
            },
          ]}
        />

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cmtg-bright-green dark:bg-cmtg-status-resolved-fg" aria-hidden />
            Met <span className="font-medium text-foreground tabular-nums">{met}</span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cmtg-brick dark:bg-cmtg-status-critical-fg" aria-hidden />
            Missed <span className="font-medium text-foreground tabular-nums">{missed}</span>
          </li>
          {pending > 0 && (
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full border border-muted-foreground/60" aria-hidden />
              Still open <span className="font-medium text-foreground tabular-nums">{pending}</span>
            </li>
          )}
        </ul>
      </div>

      <dl className="grid gap-2.5">
        {data.targets.map((t) => {
          const value = rate(t.met, t.decided);
          return (
            <div key={t.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-xs">
              <dt className="text-muted-foreground">{t.label}</dt>
              <dd
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${t.label}: ${t.met} of ${t.decided} met`}
                title={t.decided > 0 ? `${t.met} of ${t.decided} met` : "No outcomes yet"}
              >
                <div className="h-full rounded-full bg-cmtg-bright-green dark:bg-cmtg-status-resolved-fg" style={{ width: `${value ?? 0}%` }} />
              </dd>
              <dd className="text-right font-medium tabular-nums text-foreground">{formatPct(value)}</dd>
            </div>
          );
        })}
      </dl>

      <SlaExclusionNote excluded={data.excluded} />
    </section>
  );
}

function HoursPanel({ data, hourType }: { data: ReturnType<typeof summarise>; hourType: HourType }) {
  const { ssa, msa, dedicated, noAgreement, writtenOff, total } = data.hours;
  const share = (v: number) => (total > 0 ? `${Math.round((v / total) * 100)}%` : "—");

  const rows: Segment[] = [
    {
      key: "ssa",
      label: "SSA",
      value: ssa,
      fill: "bg-cmtg-series-ssa",
      detail: `${formatHours(ssa)}h`,
    },
    {
      key: "msa",
      label: "MSA",
      value: msa,
      fill: "bg-cmtg-series-msa",
      detail: `${formatHours(msa)}h`,
    },
    {
      key: "dedicated",
      label: "Dedicated Resource",
      value: dedicated,
      fill: "bg-cmtg-series-dedicated",
      detail: `${formatHours(dedicated)}h`,
    },
    {
      key: "noAgreement",
      label: "Project/Adhoc",
      value: noAgreement,
      fill: "bg-cmtg-muted",
      detail: `${formatHours(noAgreement)}h`,
    },
  ];

  return (
    <section aria-labelledby="overview-hours" className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="overview-hours" className="font-heading text-sm font-semibold text-foreground">
          Hours by agreement
        </h2>
        <p className="text-xs text-muted-foreground">{hourType === "actual_hours" ? "Actual hours" : "Invoiced hours · MSA on-site actual"}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <p className="font-heading text-cmtg-display font-semibold tracking-tight tabular-nums text-foreground">{formatHours(total)}</p>
          <p className="text-sm text-muted-foreground">hours this period</p>
        </div>
        <StackedBar label="Hours by agreement" segments={rows} />
      </div>

      <table className="w-full text-xs">
        <caption className="sr-only">Hours by agreement</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Agreement</th>
            <th scope="col">Hours</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/70 last:border-0">
              <th scope="row" className="py-2 text-left font-normal text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", r.fill)} aria-hidden />
                  {r.label}
                </span>
              </th>
              <td className="py-2 text-right font-medium tabular-nums text-foreground">{formatHours(r.value)}h</td>
              <td className="w-14 py-2 text-right tabular-nums text-muted-foreground">{share(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hourType === "invoice_hours" && writtenOff > 0 && (
        <p className="text-xs text-muted-foreground">
          Plus <span className="font-medium text-cmtg-status-pending-fg tabular-nums">{formatHours(writtenOff)}h</span> written off or non-billable, not
          charged.
        </p>
      )}
    </section>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ReportOverview({ tickets, periodLabel, hourType }: { tickets: TicketRecord[]; periodLabel: string; hourType: HourType }) {
  const data = useMemo(() => summarise(tickets), [tickets]);

  return (
    <TooltipProvider>
      <Card className="min-w-0 gap-0 py-0">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border px-5 py-3.5 sm:px-6">
          <h2 className="font-heading text-base font-semibold text-foreground">{periodLabel ? `${periodLabel} overview` : "Overview"}</h2>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{data.total}</span> tickets · <span className="tabular-nums">{data.open}</span> open ·{" "}
            <span className="tabular-nums">{data.closed}</span> closed
            {data.children > 0 && (
              <>
                {" "}
                · <span className="tabular-nums">{data.children}</span> child
              </>
            )}
          </p>
        </header>
        <div className="grid divide-y divide-border lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:divide-x lg:divide-y-0">
          <SlaPanel data={data} />
          <HoursPanel data={data} hourType={hourType} />
        </div>
      </Card>
    </TooltipProvider>
  );
}
