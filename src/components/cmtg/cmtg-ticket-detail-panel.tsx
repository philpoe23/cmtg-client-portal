import { useState } from "react";
import { cn } from "@/lib/utils";
import { CmtgCard } from "./cmtg-card";
import { CmtgStatusBadge } from "./cmtg-status-badge";
import { CmtgButton } from "./cmtg-button";
import type { CmtgTicket } from "./cmtg-types";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-wide text-cmtg-muted uppercase">{label}</div>
      <div className="mt-0.5 text-[13px] text-cmtg-ink">{value}</div>
    </div>
  );
}

export interface CmtgTicketDetailPanelProps {
  ticket: CmtgTicket | null;
  /** Fired with the textarea contents when "Save draft" is clicked. */
  onSaveDraft?: (note: string) => void;
  /** Fired with the textarea contents when "Post update" is clicked. */
  onPostUpdate?: (note: string) => void;
  className?: string;
}

export function CmtgTicketDetailPanel({ ticket, onSaveDraft, onPostUpdate, className }: CmtgTicketDetailPanelProps) {
  const [note, setNote] = useState("");

  if (!ticket) {
    return (
      <CmtgCard className={cn("flex items-center justify-center text-sm text-cmtg-muted", className)}>Select a ticket to see its details.</CmtgCard>
    );
  }

  return (
    <CmtgCard className={cn("flex flex-col gap-4 overflow-y-auto", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-cmtg-muted">#{ticket.id}</div>
          <div className="font-blueprint mt-0.5 text-base font-semibold text-cmtg-ink">{ticket.subject}</div>
        </div>
        <CmtgStatusBadge status={ticket.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 border-y border-cmtg-border py-3.5">
        <DetailField label="Client" value={ticket.client} />
        <DetailField label="Priority" value={ticket.priority} />
        <DetailField label="Assigned to" value={ticket.assignee ?? "Unassigned"} />
        <DetailField label="Updated" value={ticket.updated} />
      </div>

      {ticket.description && (
        <div>
          <div className="mb-1.5 text-[11px] tracking-wide text-cmtg-muted uppercase">Details</div>
          <p className="text-[13px] leading-relaxed text-cmtg-body">{ticket.description}</p>
        </div>
      )}

      {/* TODO: wire onSaveDraft/onPostUpdate to real ticket-update APIs once available */}
      <div className="mt-auto flex flex-col gap-2">
        <label htmlFor="cmtg-ticket-update" className="text-[11px] tracking-wide text-cmtg-muted uppercase">
          Add an update
        </label>
        <textarea
          id="cmtg-ticket-update"
          rows={3}
          placeholder="Let the client know what's happening…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none rounded-lg border border-cmtg-border px-3 py-2.5 font-sans text-[13px] text-cmtg-ink placeholder:text-cmtg-muted focus-visible:outline-2 focus-visible:outline-cmtg-blue-green focus-visible:outline-offset-1"
        />
        <div className="flex justify-end gap-2">
          <CmtgButton type="button" variant="secondary" size="sm" onClick={() => onSaveDraft?.(note)}>
            Save draft
          </CmtgButton>
          <CmtgButton type="button" variant="primary" size="sm" onClick={() => onPostUpdate?.(note)}>
            Post update
          </CmtgButton>
        </div>
      </div>
    </CmtgCard>
  );
}
