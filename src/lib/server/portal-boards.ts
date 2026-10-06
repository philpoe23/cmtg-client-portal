import type { Account } from "@/types";

const REPORT_API_URL = process.env.CW_REPORT_API_URL;

/**
 * accounts.portal_boards is set from the Report Writer's Client Portal settings: the ConnectWise
 * board IDs this company sees tickets from. Unset, null or empty means every board. Returns null
 * for "every board", otherwise the unique IDs in ascending order.
 */
export function normalizeBoardIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;
  const ids = new Set<number>();
  for (const value of raw) {
    const n = typeof value === "string" ? Number(value.trim()) : value;
    if (typeof n === "number" && Number.isInteger(n) && n > 0) ids.add(n);
  }
  return ids.size > 0 ? [...ids].sort((a, b) => a - b) : null;
}

/** null = every board. Names are lower-cased for matching ticket rows, which carry the board name rather than its ID. */
export type BoardAccess = { ids: number[]; names: Set<string> } | null;

/**
 * Resolves the account's board IDs to their current names. Throws if a restricted account's boards
 * can't be looked up, so callers show an error rather than every board's tickets.
 */
export async function getBoardAccess(account: Pick<Account, "portal_boards">): Promise<BoardAccess> {
  const ids = account.portal_boards;
  if (!ids) return null;

  const res = await fetch(`${REPORT_API_URL}/api/boards`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Couldn't load service boards (${res.status}).`);
  const data = (await res.json()) as { boards?: { id: number; name: string }[] };

  const allowed = new Set(ids);
  const names = new Set((data.boards ?? []).filter((b) => allowed.has(b.id)).map((b) => b.name.trim().toLowerCase()));
  return { ids, names };
}

export function isBoardAllowed(access: BoardAccess, boardName: string | null | undefined): boolean {
  return access === null || access.names.has((boardName ?? "").trim().toLowerCase());
}
