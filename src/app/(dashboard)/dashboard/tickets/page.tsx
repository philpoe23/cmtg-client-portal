import { redirect } from "next/navigation";
import { createClient } from "@/lib/pocketbase/server";
import { getAccountUser } from "@/lib/server/get-account";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { getCompanyTickets } from "@/lib/api/tickets";
import { AllTicketsTable } from "@/components/portal/all-tickets-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default async function AllTicketsPage() {
  if (!DEV_BYPASS) {
    const pb = await createClient();
    if (!pb.authStore.isValid) redirect("/login");
  }

  const accountUser = await getAccountUser();
  if (!accountUser?.accounts) {
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

  const result = await getCompanyTickets(cwCompanyRecid, accessToken, {
    start_date: formatDate(thirtyDaysAgo),
    end_date: formatDate(today),
  }).catch(() => null);

  const tickets = result?.tickets ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Tickets</h1>
        <p className="text-muted-foreground text-sm mt-0.5">All tickets from the last 30 days</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AllTicketsTable tickets={tickets} />
        </CardContent>
      </Card>
    </div>
  );
}
