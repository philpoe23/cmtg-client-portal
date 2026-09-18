"use server";

import { getAccountUser } from "@/lib/server/get-account";
import { fetchReportPreview } from "@/lib/server/report";
import type { TicketRecord } from "@/types";

/**
 * Fetches the richer report-preview data (SLA, hours, billing) used by the
 * ticket detail dialog/panel. Kept out of page's initial render — this report
 * endpoint is much slower than the ticket list/summary calls, and blocking a
 * whole page on it once made /dashboard take 20+ seconds to load.
 */
export async function fetchReportTicketsForRange(startDate: string, endDate: string): Promise<TicketRecord[]> {
  const accountUser = await getAccountUser();
  if (!accountUser?.accounts) return [];

  return fetchReportPreview(accountUser.accounts.company_name, startDate, endDate)
    .then((result) => result.data)
    .catch(() => []);
}
