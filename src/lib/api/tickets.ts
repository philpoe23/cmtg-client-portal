import type { TicketDetail, TicketFilters, TicketSummary, TicketsResponse } from "@/types";

const TICKETS_API_URL = process.env.NEXT_PUBLIC_TICKETS_API_URL;

function authHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getTicketSummary(cwCompanyRecid: number, accessToken: string): Promise<TicketSummary> {
  const res = await fetch(`${TICKETS_API_URL}/tickets/summary?company_recid=${cwCompanyRecid}`, { headers: authHeaders(accessToken) });
  return handleResponse<TicketSummary>(res);
}

export async function getTickets(cwCompanyRecid: number, accessToken: string, filters: TicketFilters = {}): Promise<TicketsResponse> {
  const params = new URLSearchParams({
    company_recid: String(cwCompanyRecid),
    page: String(filters.page ?? 1),
    page_size: String(filters.page_size ?? 25),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  });

  const res = await fetch(`${TICKETS_API_URL}/tickets?${params.toString()}`, {
    headers: authHeaders(accessToken),
  });
  return handleResponse<TicketsResponse>(res);
}

export async function getTicket(cwCompanyRecid: number, ticketId: number, accessToken: string): Promise<TicketDetail> {
  const res = await fetch(`${TICKETS_API_URL}/tickets/${ticketId}?company_recid=${cwCompanyRecid}`, { headers: authHeaders(accessToken) });
  return handleResponse<TicketDetail>(res);
}
