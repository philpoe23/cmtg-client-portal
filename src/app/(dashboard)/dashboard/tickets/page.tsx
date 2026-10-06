import { redirect } from "next/navigation";
import { createClient } from "@/lib/pocketbase/server";
import { getAccountUser } from "@/lib/server/get-account";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { getCompanyTickets } from "@/lib/api/tickets";
import { getBoardAccess, isBoardAllowed } from "@/lib/server/portal-boards";
import { AllTicketsTable } from "@/components/portal/all-tickets-table";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default async function AllTicketsPage() {
  if (!DEV_BYPASS) {
    const pb = await createClient();
    if (!pb.authStore.isValid) redirect("/login");
  }

  const accountUser = await getAccountUser();
  if (!accountUser) redirect("/login");
  if (!accountUser.accounts) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Tickets</h1>
        <p className="text-destructive text-sm">Your account is not linked to a company. Please contact your administrator.</p>
      </div>
    );
  }

  const cwCompanyRecid = accountUser.accounts.cw_company_recid;
  let accessToken = "";
  if (!DEV_BYPASS) {
    const pb = await createClient();
    accessToken = pb.authStore.token;
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const startDate = formatDate(thirtyDaysAgo);
  const endDate = formatDate(today);

  // A restricted account whose boards can't be looked up sees no tickets rather than every board's
  const boards = await getBoardAccess(accountUser.accounts).catch(() => undefined);
  const result =
    boards === undefined
      ? null
      : await getCompanyTickets(cwCompanyRecid, accessToken, { start_date: startDate, end_date: endDate, boards: boards?.ids }).catch(() => null);

  // Also filtered here: the report API ignores `boards` until it supports the filter
  const tickets = (result?.tickets ?? []).filter((t) => boards !== undefined && isBoardAllowed(boards, t.board));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-blueprint text-xl font-semibold text-cmtg-ink">Tickets</h1>
          <p className="text-sm text-cmtg-muted mt-0.5">All tickets from the last 30 days</p>
        </div>
      </div>

      <AllTicketsTable tickets={tickets} startDate={startDate} endDate={endDate} />
    </div>
  );
}
