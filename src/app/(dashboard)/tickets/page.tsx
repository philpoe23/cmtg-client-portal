"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { createClient } from "@/lib/pocketbase/client";
import { getReportPreview } from "@/lib/api/report";
import { useTrack } from "@/hooks/use-track";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import ReportTicketsTable from "@/components/portal/report-tickets-table";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import type { TicketRecord } from "@/types";

// Dev mode company
const DEV_COMPANY_NAME = "Training Alliance Group (TAG)";

export default function TicketsPage() {
  const { track } = useTrack();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketRecord[] | null>(null);
  const [totalTickets, setTotalTickets] = useState(0);

  // Resolve company name from PocketBase account_users collection on mount
  useEffect(() => {
    async function resolveCompany() {
      if (DEV_BYPASS) {
        setCompanyName(DEV_COMPANY_NAME);
        return;
      }

      const pb = createClient();
      const model = pb.authStore.model;
      if (!model) return;

      try {
        const result = await pb.collection("account_users").getFirstListItem(`user_id = "${model.id}"`, {
          expand: "account_id",
        });
        const company = (result.expand as Record<string, Record<string, unknown>> | undefined)?.account_id?.company_name as string | undefined;
        if (company) setCompanyName(company);
        else toast.error("Could not resolve your company. Please contact support.");
      } catch {
        toast.error("Failed to load your account. Please refresh or contact support.");
      }
    }

    resolveCompany();
  }, []);

  // Track page view once
  useEffect(() => {
    track({ event_type: "page_view", event_name: "view_tickets" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canRun = !!(companyName && dateRange?.from && dateRange?.to);

  async function handleRunReport() {
    if (!canRun) return;
    setLoading(true);
    setTickets(null);
    try {
      const result = await getReportPreview(companyName!, format(dateRange!.from!, "yyyy-MM-dd"), format(dateRange!.to!, "yyyy-MM-dd"));
      setTickets(result.data);
      setTotalTickets(result.total_tickets);
      track({
        event_type: "click",
        event_name: "run_service_report",
        metadata: {
          company: companyName,
          start_date: format(dateRange!.from!, "yyyy-MM-dd"),
          end_date: format(dateRange!.to!, "yyyy-MM-dd"),
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
        <h1 className="text-xl font-semibold">Service Report</h1>
        {companyName && <p className="mt-0.5 text-sm text-muted-foreground">{companyName}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DatePickerWithRange value={dateRange} onSelect={setDateRange} />
        <Button onClick={handleRunReport} disabled={!canRun || loading}>
          {loading ? "Loading…" : "Run Report"}
        </Button>
      </div>

      {tickets !== null && <ReportTicketsTable tickets={tickets} total={totalTickets} />}
    </div>
  );
}
