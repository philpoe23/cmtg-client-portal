import { NextRequest, NextResponse } from "next/server";
import { fetchReportPreview } from "@/lib/server/report";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await fetchReportPreview(body.company_name, body.start_date, body.end_date);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Failed to reach report API" }, { status: 502 });
  }
}
