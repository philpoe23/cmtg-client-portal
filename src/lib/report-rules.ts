import type { TicketRecord } from "@/types";

// ─── Agreement buckets ───────────────────────────────────────────────────────

export type AgreementBucket = "ssa" | "msa" | "dedicated" | "noAgreement";

// "MSA - Onsite Helpdesk" is a dedicated on-site resource, not regular MSA support.
const ONSITE_HELPDESK = /msa\s*-\s*onsite helpdesk/i;

/** Which hours column a time entry's agreement belongs to. No agreement is shown as Project/Adhoc. */
export function agreementBucket(agreement: string | null | undefined): AgreementBucket {
  const ag = agreement ?? "";
  if (ONSITE_HELPDESK.test(ag)) return "dedicated";
  const lower = ag.toLowerCase();
  if (lower.includes("ssa")) return "ssa";
  if (lower.includes("msa")) return "msa";
  if (lower.includes("dedicated")) return "dedicated";
  return "noAgreement";
}

/** A ticket worked under "MSA - Onsite Helpdesk", on the ticket or on any of its time entries. */
export function isOnsiteHelpdeskTicket(ticket: TicketRecord): boolean {
  if (ONSITE_HELPDESK.test(ticket["Agreements Used"] ?? "")) return true;
  return (ticket.hours_summary?.by_period ?? []).some((p) => p.entries.some((e) => ONSITE_HELPDESK.test(e.agreement ?? "")));
}

/**
 * Every hour on an Onsite Helpdesk ticket counts as Dedicated Resource, except SSA hours, which stay
 * SSA so prepaid SSA blocks still add up. Idempotent.
 */
export function applyDedicatedRule(ticket: TicketRecord): TicketRecord {
  if (!isOnsiteHelpdeskTicket(ticket)) return ticket;
  const moved = (ticket["MSA Hours"] ?? 0) + (ticket["No Agreement Hours"] ?? 0);
  if (moved === 0) return ticket;
  return {
    ...ticket,
    "MSA Hours": 0,
    "No Agreement Hours": 0,
    "Dedicated Resource Hours": (ticket["Dedicated Resource Hours"] ?? 0) + moved,
  };
}

// ─── SLA ─────────────────────────────────────────────────────────────────────

export function isChildTicket(ticket: TicketRecord): boolean {
  return ticket["Parent Ticket #"] != null;
}

/** Any time logged on the ticket, in this period or any other, billable or not. */
export function hasLoggedTime(ticket: TicketRecord): boolean {
  if ((ticket["Total Hours"] ?? 0) > 0) return true;
  return (ticket.hours_summary?.by_period ?? []).some((p) =>
    p.entries.some((e) => (Number(e.actual_hours) || 0) + (Number(e.billable_hours) || 0) + (Number(e.non_billable_hours) || 0) > 0),
  );
}

export type SlaExclusion = "child" | "no_time";

/**
 * Why a ticket is left out of SLA figures, or null if it counts. Child tickets are governed by
 * their parent's SLA; tickets with no time logged had no work done against the SLA.
 */
export function slaExclusion(ticket: TicketRecord): SlaExclusion | null {
  if (isChildTicket(ticket)) return "child";
  if (!hasLoggedTime(ticket)) return "no_time";
  return null;
}
