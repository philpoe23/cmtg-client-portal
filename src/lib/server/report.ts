import type { ReportPreviewResponse, TicketRecord } from "@/types";
import { isBoardAllowed, type BoardAccess } from "@/lib/server/portal-boards";
import { isSiteAllowed } from "@/lib/server/portal-sites";

/** What the signed-in company may see: from getBoardAccess and accounts.portal_sites. */
export interface TicketAccess {
  boards: BoardAccess;
  sites: string[] | null;
}

const REPORT_API_URL = process.env.CW_REPORT_API_URL;

/** Parent references arrive as numbers (whole floats included), numeric strings, or null/0/"" for "no parent". */
function toTicketNbr(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTicket(raw: Record<string, any>): TicketRecord {
  return {
    "Ticket #": raw["Ticket #"] ?? raw.TicketNbr ?? raw.ticket_nbr ?? null,
    "Parent Ticket #": toTicketNbr(
      // The report API sends the parent's ticket number as `Parent` (a float, e.g. 424561.0), null when there's none
      raw["Parent Ticket #"] ?? raw.Parent ?? raw.Parent_TicketNbr ?? raw.parent_ticket_nbr ?? raw.Parent_Ticket ?? raw.parent_ticket ?? raw.parent_ticket_id ?? raw.parentTicketId,
    ),
    "Primary Contact": raw["Primary Contact"] ?? raw.Contact_Name ?? raw.contact_name ?? "",
    Site: raw.Site ?? raw.Site_Name ?? raw.site_name ?? "",
    "Created Date": raw["Created Date"] ?? raw.Date_Entered ?? raw.date_entered ?? null,
    "Resolved Date": raw["Resolved Date"] ?? raw.Date_Resolved_UTC ?? raw.date_resolved_utc ?? null,
    "Ticket Type": raw["Ticket Type"] ?? raw.ServiceType ?? raw.service_type ?? raw.Ticket_Type ?? raw.ticket_type ?? raw.Type ?? raw.type ?? "",
    "Sub Type": raw["Sub Type"] ?? raw.ServiceSubType ?? raw.service_sub_type ?? raw.Sub_Type ?? raw.sub_type ?? "",
    "SLA Priority": raw["SLA Priority"] ?? raw.Priority_Description ?? raw.SLA_Priority ?? raw.sla_priority ?? raw.Priority ?? raw.priority ?? "",
    "SLA Attainment": raw["SLA Attainment"] ?? raw.SLA_Attainment ?? raw.sla_attainment ?? "",
    "SLA Response": raw["SLA Response"] ?? raw.SLA_Response ?? raw.sla_response ?? "",
    "SLA Plan": raw["SLA Plan"] ?? raw.SLA_Plan ?? raw.sla_plan ?? "",
    "SLA Resolution": raw["SLA Resolution"] ?? raw.SLA_Resolution ?? raw.sla_resolution ?? "",
    "Techs Worked": raw["Techs Worked"] ?? raw.Techs_Worked ?? raw.techs_worked ?? "",
    Summary: raw.Summary ?? raw.summary ?? raw.Initial_Description ?? raw.initial_description ?? "",
    Detail: raw.Detail ?? raw.Detail_Description ?? raw.detail_description ?? raw.detail ?? "",
    Resolution: raw.Resolution ?? raw.resolution ?? "",
    Board: raw.Board ?? raw.Board_Name ?? raw.board_name ?? "",
    "Agreements Used": raw["Agreements Used"] ?? raw.Agreements_Used ?? raw.agreements_used ?? "",
    "SSA Hours": raw["SSA Hours"] ?? raw.SSA_Hours ?? raw.ssa_hours ?? 0,
    "MSA Hours": raw["MSA Hours"] ?? raw.MSA_Hours ?? raw.msa_hours ?? 0,
    "Dedicated Resource Hours": raw["Dedicated Resource Hours"] ?? raw.Dedicated_Resource_Hours ?? raw.dedicated_resource_hours ?? 0,
    "No Agreement Hours": raw["No Agreement Hours"] ?? raw.No_Agreement_Hours ?? raw.no_agreement_hours ?? 0,
    "Written Off / Non-Billable Hours":
      raw["Written Off / Non-Billable Hours"] ?? raw.Written_Off_Hours ?? (raw.Write_Off_Hours ?? 0) + (raw.Non_Billable_Hours ?? raw.non_billable_hours ?? 0),
    "Total Hours": raw["Total Hours"] ?? raw.Total_Hours ?? raw.total_hours ?? 0,
    Closed_Flag: raw.Closed_Flag === true || raw.Closed_Flag === 1 ? 1 : 0,
    hours_summary: raw.hours_summary ?? null,
  };
}

/** Only tickets from the boards and sites in `access` are returned. */
export async function fetchReportPreview(company_name: string, start_date: string, end_date: string, access: TicketAccess): Promise<ReportPreviewResponse> {
  const { boards, sites } = access;
  const upstream = await fetch(`${REPORT_API_URL}/api/report/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name, start_date, end_date, ...(boards ? { board_ids: boards.ids } : {}) }),
  });

  const raw = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    throw new Error((raw as { detail?: string }).detail ?? `Request failed: ${upstream.status}`);
  }

  const tickets: Record<string, unknown>[] = Array.isArray(raw.data) ? raw.data : [];
  if (boards === null && sites === null) {
    return {
      total_tickets: raw.total_tickets ?? tickets.length,
      data: tickets.map(transformTicket),
    };
  }

  // Boards are also filtered here because the report API ignores board_ids until it supports the
  // filter; sites are only filtered here
  const data = tickets.map(transformTicket).filter((t) => isBoardAllowed(boards, t.Board) && isSiteAllowed(sites, t.Site));
  return { total_tickets: data.length, data };
}
