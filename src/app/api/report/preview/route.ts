import { NextRequest, NextResponse } from "next/server";
import { getAccountUser } from "@/lib/server/get-account";
import { getBoardAccess } from "@/lib/server/portal-boards";
import { fetchReportPreview } from "@/lib/server/report";

/**
 * Report preview for the signed-in user's own company, limited to the boards set for that company.
 * The company comes from the session, not the request body, so a user can't ask for another company.
 */
export async function POST(req: NextRequest) {
  const accountUser = await getAccountUser();
  if (!accountUser?.accounts) {
    return NextResponse.json({ detail: "Not signed in." }, { status: 401 });
  }
  const { accounts } = accountUser;

  try {
    const body = await req.json();
    const boards = await getBoardAccess(accounts);
    const result = await fetchReportPreview(accounts.company_name, body.start_date, body.end_date, boards);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ detail: err instanceof Error ? err.message : "Failed to reach report API" }, { status: 502 });
  }
}
