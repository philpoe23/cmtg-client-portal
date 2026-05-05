import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/pocketbase/server";
import { getAccountUser } from "@/lib/server/get-account";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { getTicket } from "@/lib/api/tickets";
import { TicketStatusBadge } from "@/components/portal/ticket-status-badge";
import { TicketPriorityBadge } from "@/components/portal/ticket-priority-badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm flex-1">{value ?? "—"}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) notFound();

  if (!DEV_BYPASS) {
    const pb = await createClient();
    if (!pb.authStore.isValid) redirect("/login");
  }

  const accountUser = await getAccountUser();
  if (!accountUser?.accounts) redirect("/login");

  let accessToken = "";
  if (!DEV_BYPASS) {
    const pb = await createClient();
    accessToken = pb.authStore.token;
  }

  let ticket;
  try {
    ticket = await getTicket(accountUser.accounts.cw_company_recid, ticketId, accessToken);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link href="/service-summary-report" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft size={13} />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">#{ticket.id}</span>
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-lg font-semibold leading-snug">{ticket.summary}</h1>
      </div>

      <Separator />

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ticket Details</p>
          <div>
            <DetailRow label="Board" value={ticket.board_name} />
            <DetailRow label="Type" value={ticket.type} />
            <DetailRow label="Sub-type" value={ticket.sub_type} />
            <DetailRow label="Assigned To" value={ticket.assigned_to} />
            <DetailRow label="Contact" value={ticket.contact_name} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Dates</p>
          <div>
            <DetailRow label="Entered" value={formatDate(ticket.date_entered)} />
            <DetailRow label="Last Updated" value={formatDate(ticket.date_last_updated)} />
            <DetailRow label="SLA Status" value={ticket.sla_status} />
            {ticket.budget_hours != null && <DetailRow label="Budget Hours" value={`${ticket.budget_hours}h`} />}
            {ticket.actual_hours != null && <DetailRow label="Actual Hours" value={`${ticket.actual_hours}h`} />}
          </div>
        </div>
      </div>

      {/* Description */}
      {ticket.initial_description && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
          <div className="bg-card border border-border rounded-md p-4 text-sm whitespace-pre-wrap leading-relaxed">{ticket.initial_description}</div>
        </div>
      )}

      {/* Notes */}
      {ticket.notes?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Notes ({ticket.notes.length})</p>
          <div className="space-y-3">
            {ticket.notes
              .filter((n) => !n.is_internal)
              .map((note) => (
                <div key={note.id} className="bg-card border border-border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{note.created_by}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(note.date_created)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.text}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
