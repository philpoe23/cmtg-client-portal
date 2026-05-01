// ─── Report API ─────────────────────────────────────────────────────────────

export interface TicketRecord {
  "Ticket #": number;
  "Primary Contact": string;
  Site: string;
  "Created Date": string;
  "Resolved Date": string | null;
  "Ticket Type": string;
  "Sub Type": string;
  "SLA Priority": string;
  "SLA Attainment": string; // "Met" | "Missed" | "Open"
  "SLA Response": string; // "Met" | "Not Met"
  "SLA Plan": string;
  "SLA Resolution": string;
  "Techs Worked": string;
  Summary: string;
  Detail: string;
  Resolution: string;
  Board: string;
  "Agreements Used": string;
  "SSA Hours": number;
  "MSA Hours": number;
  "Dedicated Resource Hours": number;
  "No Agreement Hours": number;
  "Written Off / Non-Billable Hours": number;
  "Total Hours": number;
  Closed_Flag: 0 | 1;
}

export interface ReportPreviewResponse {
  total_tickets: number;
  data: TicketRecord[];
}

// ─── Tickets (legacy) ────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  summary: string;
  status: string;
  priority: string;
  board_name: string;
  type: string | null;
  sub_type: string | null;
  contact_name: string | null;
  assigned_to: string | null;
  date_entered: string;
  date_last_updated: string;
  sla_status: string | null;
  budget_hours: number | null;
  actual_hours: number | null;
}

export interface TicketNote {
  id: number;
  note_type: string;
  text: string;
  created_by: string;
  date_created: string;
  is_internal: boolean;
}

export interface TicketDetail extends Ticket {
  description: string | null;
  initial_description: string | null;
  notes: TicketNote[];
}

export interface TicketSummary {
  open: number;
  in_progress: number;
  waiting: number;
  closed: number;
  total: number;
}

export interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  page_size: number;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// ─── PocketBase ─────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  cw_company_recid: number;
  company_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AccountUser {
  id: string;
  account_id: string;
  user_id: string;
  email: string;
  role: "admin" | "viewer";
  otp_used: boolean;
  created_at: string;
  accounts?: Account;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  account_id: string;
  event_type: string;
  event_name: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface MfaState {
  mfaId: string;
  email: string;
}
