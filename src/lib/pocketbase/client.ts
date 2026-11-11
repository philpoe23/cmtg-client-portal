import PocketBase from "pocketbase";

/**
 * Browser-side PocketBase base URL. Requests go to the portal's own origin and
 * are forwarded to the internal PocketBase server by the rewrite in
 * next.config.ts — the browser can't reach PocketBase directly.
 */
export const BROWSER_POCKETBASE_URL = "/pb";

export function createClient() {
  return new PocketBase(BROWSER_POCKETBASE_URL);
}
