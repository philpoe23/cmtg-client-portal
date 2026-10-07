/**
 * accounts.portal_sites is set from the Report Writer's Client Portal settings: the names of the
 * company's ConnectWise sites whose tickets it sees. Unset, null or empty means every site.
 * Returns null for "every site", otherwise the unique trimmed names.
 */
export function normalizeSiteNames(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const names = new Map<string, string>();
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const name = value.trim();
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
  }
  return names.size > 0 ? [...names.values()] : null;
}

/** Ticket rows carry the site's name; a row with no site is only shown when every site is allowed. */
export function isSiteAllowed(sites: string[] | null, siteName: string | null | undefined): boolean {
  if (sites === null) return true;
  const name = (siteName ?? "").trim().toLowerCase();
  return name !== "" && sites.some((s) => s.toLowerCase() === name);
}
