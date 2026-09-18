export type CmtgTicketStatus = "resolved" | "in-progress" | "pending" | "critical" | "info";
export type CmtgTicketPriority = "critical" | "high" | "normal" | "low";

// TODO: replace with the real ticket shape once wired up to the tickets API —
// this mirrors the CMTG mockup's sample data fields.
export interface CmtgTicket {
  id: string;
  subject: string;
  client: string;
  status: CmtgTicketStatus;
  priority: CmtgTicketPriority;
  updated: string;
  assignee?: string;
  description?: string;
}
