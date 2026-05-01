import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/pocketbase/server";
import { getAccountUser } from "@/lib/server/get-account";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { getTicketSummary, getTickets } from "@/lib/api/tickets";
import StatsCard from "@/components/portal/stats-card";
import { TicketStatusBadge } from "@/components/portal/ticket-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  if (!DEV_BYPASS) {
    const pb = await createClient();
    if (!pb.authStore.isValid) redirect("/login");
  }

  const accountUser = await getAccountUser();
  if (!accountUser?.accounts) redirect("/login");

  const cwCompanyRecid = accountUser.accounts.cw_company_recid;
  let accessToken = "";
  if (!DEV_BYPASS) {
    const pb = await createClient();
    accessToken = pb.authStore.token;
  }

  const [summary, recentTickets] = await Promise.allSettled([
    getTicketSummary(cwCompanyRecid, accessToken),
    getTickets(cwCompanyRecid, accessToken, { page: 1, page_size: 5 }),
  ]);

  const stats = summary.status === "fulfilled" ? summary.value : null;
  const recent = recentTickets.status === "fulfilled" ? recentTickets.value : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your support tickets</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Open" value={stats?.open ?? 0} />
        <StatsCard title="In Progress" value={stats?.in_progress ?? 0} />
        <StatsCard title="Waiting" value={stats?.waiting ?? 0} variant="warning" />
        <StatsCard title="Closed" value={stats?.closed ?? 0} variant="muted" />
      </div>

      {/* Recent tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Recent Tickets</CardTitle>
          <Link href="/portal/tickets" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {recent?.tickets?.length ? (
            <div className="divide-y divide-border -mx-6">
              {recent.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/tickets/${ticket.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ticket.summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{ticket.id} · {ticket.board_name}
                    </p>
                  </div>
                  <TicketStatusBadge status={ticket.status} className="ml-4 shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No recent tickets</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
