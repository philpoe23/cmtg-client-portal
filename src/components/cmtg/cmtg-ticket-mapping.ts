import type { CompanyTicket } from "@/types";
import type { CmtgTicket, CmtgTicketPriority, CmtgTicketStatus } from "./cmtg-types";

/** Maps this app's free-text ConnectWise ticket status onto the CMTG badge's fixed status set. */
export function mapTicketStatus(status: string): CmtgTicketStatus {
  switch (status.toLowerCase()) {
    case "closed":
      return "resolved";
    case "in progress":
      return "in-progress";
    case "waiting for customer":
    case "pending":
      return "pending";
    default:
      return "info";
  }
}

function mapTicketPriority(priority: string): CmtgTicketPriority {
  switch (priority.toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "normal";
  }
}

/** Maps a CompanyTicket (from the tickets list API) into the CmtgTicket shape the branded components expect. */
export function toCmtgTicket(ticket: CompanyTicket): CmtgTicket {
  return {
    id: String(ticket.ticket_id),
    subject: ticket.summary || "—",
    client: ticket.contact_name ?? ticket.company,
    status: mapTicketStatus(ticket.status),
    priority: mapTicketPriority(ticket.priority),
    updated: new Date(ticket.date_entered).toLocaleDateString(),
    // TODO: assignee/description aren't in the company-tickets list response —
    // wire these up once a ticket-detail endpoint with matching IDs is available.
  };
}
