"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { getReportPreview } from "@/lib/api/report";
import { fetchCompanyName } from "./actions";
import { useTrack } from "@/hooks/use-track";
import { MonthYearPicker, type MonthYearValue } from "@/components/ui/month-year-picker";
import { Button } from "@/components/ui/button";
import ReportTicketsTable from "@/components/portal/report-tickets-table";
import type { TicketRecord } from "@/types";

export default function ServiceSummaryReportPage() {
  const { track } = useTrack();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthYearValue | undefined>();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketRecord[] | null>(null);
  const [totalTickets, setTotalTickets] = useState(0);

  // Resolve company name via server action on mount
  useEffect(() => {
    // fetch("http://10.90.90.33:8001/api/report/preview", {
    // method: "POST",
    // headers: { "Content-Type": "application/json" },
    // body: JSON.stringify({ company_name: "Training Alliance Group (TAG)", start_date: "2026-05-01", end_date: "2026-05-05" }),
    // })
    // .then((r) => r.json())
    // .then((d) => console.log(JSON.stringify(d.data?.[0], null, 2)));
    fetchCompanyName()
      .then((name) => {
        if (name) setCompanyName(name);
        else toast.error("Could not resolve your company. Please contact support.");
      })
      .catch(() => toast.error("Failed to load your account. Please refresh or contact support."));
  }, []);

  // Track page view once
  useEffect(() => {
    track({ event_type: "page_view", event_name: "view_tickets" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canRun = !!(companyName && selectedMonth);

  async function handleRunReport() {
    if (!canRun) return;
    setLoading(true);
    setTickets(null);
    try {
      const start = startOfMonth(new Date(selectedMonth!.year, selectedMonth!.month - 1));
      const end = endOfMonth(start);
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");
      const result = await getReportPreview(companyName!, startDate, endDate);
      console.log("Report result:", result.data);
      setTickets(result.data);
      setTotalTickets(result.total_tickets);
      track({
        event_type: "click",
        event_name: "run_service_report",
        metadata: {
          company: companyName,
          start_date: startDate,
          end_date: endDate,
          total_tickets: result.total_tickets,
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load report. Please try again.");
      setTickets(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Service Summary Report</h1>
        {companyName && <p className="mt-0.5 text-sm text-muted-foreground">{companyName}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
        <Button onClick={handleRunReport} disabled={!canRun || loading}>
          {loading ? "Loading…" : "Run Report"}
        </Button>
      </div>

      {tickets !== null && (
        <ReportTicketsTable
          tickets={tickets}
          total={totalTickets}
          periodLabel={selectedMonth ? format(new Date(selectedMonth.year, selectedMonth.month - 1, 1), "MMMM yyyy") : ""}
        />
      )}
    </div>
  );
}
