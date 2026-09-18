import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/pocketbase/server";
import { DEV_BYPASS } from "@/lib/dev-bypass";

// Same FastAPI service that serves /api/report/preview.
const REPORT_API_URL = process.env.CW_REPORT_API_URL;

export async function POST(req: NextRequest) {
  if (!DEV_BYPASS) {
    const pb = await createClient();
    if (!pb.authStore.isValid) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();

    const upstream = await fetch(`${REPORT_API_URL}/api/xlsx/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const detail = await upstream
        .json()
        .then((d) => (d as { detail?: string }).detail)
        .catch(() => null);
      return NextResponse.json({ detail: detail ?? `Workbook generation failed: ${upstream.status}` }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": upstream.headers.get("content-disposition") ?? `attachment; filename="${body.filename ?? "export"}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Failed to reach the workbook API" }, { status: 502 });
  }
}
