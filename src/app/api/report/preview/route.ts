import { NextRequest, NextResponse } from "next/server";

const REPORT_API_URL = process.env.CW_REPORT_API_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTicket(raw: Record<string, any>) {
  return {
    "Ticket #": raw["Ticket #"] ?? raw.TicketNbr ?? raw.ticket_nbr ?? null,
    "Primary Contact": raw["Primary Contact"] ?? raw.Contact_Name ?? raw.contact_name ?? "",
    Site: raw.Site ?? raw.Site_Name ?? raw.site_name ?? "",
    "Created Date": raw["Created Date"] ?? raw.Date_Entered ?? raw.date_entered ?? null,
    "Resolved Date": raw["Resolved Date"] ?? raw.Date_Resolved_UTC ?? raw.date_resolved_utc ?? null,
    "Ticket Type": raw["Ticket Type"] ?? raw.Type ?? raw.type ?? "",
    "Sub Type": raw["Sub Type"] ?? raw.Sub_Type ?? raw.sub_type ?? "",
    "SLA Priority": raw["SLA Priority"] ?? raw.Priority ?? raw.priority ?? "",
    "SLA Attainment": raw["SLA Attainment"] ?? raw.SLA_Attainment ?? raw.sla_attainment ?? "",
    "SLA Response": raw["SLA Response"] ?? raw.SLA_Response ?? raw.sla_response ?? "",
    "SLA Plan": raw["SLA Plan"] ?? raw.SLA_Plan ?? raw.sla_plan ?? "",
    "SLA Resolution": raw["SLA Resolution"] ?? raw.SLA_Resolution ?? raw.sla_resolution ?? "",
    "Techs Worked": raw["Techs Worked"] ?? raw.Techs_Worked ?? raw.techs_worked ?? "",
    Summary: raw.Summary ?? raw.summary ?? "",
    Detail: raw.Detail ?? raw.detail ?? "",
    Resolution: raw.Resolution ?? raw.resolution ?? "",
    Board: raw.Board ?? raw.Board_Name ?? raw.board_name ?? "",
    "Agreements Used": raw["Agreements Used"] ?? raw.Agreements_Used ?? raw.agreements_used ?? "",
    "SSA Hours": raw["SSA Hours"] ?? raw.SSA_Hours ?? raw.ssa_hours ?? 0,
    "MSA Hours": raw["MSA Hours"] ?? raw.MSA_Hours ?? raw.msa_hours ?? 0,
    "Dedicated Resource Hours": raw["Dedicated Resource Hours"] ?? raw.Dedicated_Resource_Hours ?? raw.dedicated_resource_hours ?? 0,
    "No Agreement Hours": raw["No Agreement Hours"] ?? raw.No_Agreement_Hours ?? raw.no_agreement_hours ?? 0,
    "Written Off / Non-Billable Hours":
      raw["Written Off / Non-Billable Hours"] ?? raw.Written_Off_Hours ?? raw.written_off_hours ?? 0,
    "Total Hours": raw["Total Hours"] ?? raw.Total_Hours ?? raw.total_hours ?? 0,
    Closed_Flag: raw.Closed_Flag === true || raw.Closed_Flag === 1 ? 1 : 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch(`${REPORT_API_URL}/api/report/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(raw, { status: upstream.status });
    }

    const tickets: Record<string, unknown>[] = Array.isArray(raw.data) ? raw.data : [];
    const transformed = {
      total_tickets: raw.total_tickets ?? tickets.length,
      data: tickets.map(transformTicket),
    };

    return NextResponse.json(transformed, { status: 200 });
  } catch {
    return NextResponse.json({ detail: "Failed to reach report API" }, { status: 502 });
  }
}
