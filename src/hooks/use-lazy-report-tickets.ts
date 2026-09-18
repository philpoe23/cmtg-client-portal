"use client";

import { useCallback, useRef, useState } from "react";
import { fetchReportTicketsForRange } from "@/app/(dashboard)/actions";
import type { TicketRecord } from "@/types";

/**
 * Fetches the report-preview ticket data (SLA/hours/billing) only when
 * something actually needs it — not automatically on mount — mirroring how
 * the Service Summary Report page only runs this same slow report when the
 * user clicks "Run Report". Once fetched, the result is cached for the life
 * of the component, so only the first ticket click pays the wait.
 */
export function useLazyReportTickets(startDate: string, endDate: string) {
  const [tickets, setTickets] = useState<TicketRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef<Promise<TicketRecord[]> | null>(null);

  const ensureLoaded = useCallback((): Promise<TicketRecord[]> => {
    if (tickets) return Promise.resolve(tickets);
    if (!inFlightRef.current) {
      setLoading(true);
      inFlightRef.current = fetchReportTicketsForRange(startDate, endDate)
        .then((records) => {
          setTickets(records);
          return records;
        })
        .finally(() => {
          setLoading(false);
          inFlightRef.current = null;
        });
    }
    return inFlightRef.current;
  }, [tickets, startDate, endDate]);

  return { tickets, loading, ensureLoaded };
}
