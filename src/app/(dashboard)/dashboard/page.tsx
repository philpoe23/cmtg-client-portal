import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/pocketbase/server";
import { getAccountUser } from "@/lib/server/get-account";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { getTicketSummary, getCompanyTickets } from "@/lib/api/tickets";
import StatsCard from "@/components/portal/stats-card";
import { DashboardTicketsTable } from "@/components/portal/dashboard-tickets-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default async function DashboardPage() {
  if (!DEV_BYPASS) {
    const pb = await createClient();
    if (!pb.authStore.isValid) redirect("/login");
  }

  const accountUser = await getAccountUser();
  if (!accountUser?.accounts) {
    return (
      <div className="space-y-4 max-w-5xl">
        <h1 className="text-xl font-semibold">Dashboard</h1>
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

  const [summary, recentTickets] = await Promise.allSettled([
    getTicketSummary(cwCompanyRecid, accessToken),
    getCompanyTickets(cwCompanyRecid, accessToken, {
      start_date: formatDate(thirtyDaysAgo),
      end_date: formatDate(today),
    }),
  ]);

  const stats = summary.status === "fulfilled" ? summary.value : null;
  const recent = recentTickets.status === "fulfilled" ? recentTickets.value : null;

  return (
    <div className="space-y-6">
      <div className="max-w-5xl">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your support tickets</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 max-w-5xl">
        <StatsCard title="Open" value={stats?.open ?? 0} />
        <StatsCard title="In Progress" value={stats?.in_progress ?? 0} />
        <StatsCard title="Waiting" value={stats?.waiting ?? 0} variant="warning" />
      </div>

      {/* Tickets last 30 days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Tickets — Last 30 Days</CardTitle>
            {recent && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {recent.total_tickets} ticket{recent.total_tickets !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Link href="/dashboard/tickets" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <DashboardTicketsTable tickets={recent?.tickets ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
