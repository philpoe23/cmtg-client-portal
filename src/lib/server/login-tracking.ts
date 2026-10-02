import { getServiceClient } from "@/lib/pocketbase/service";

/**
 * Stamps portal_users.last_login (and activated_at on the first completed
 * 2FA enrollment) so staff can see in the PocketBase admin who is actually
 * using their account and which ones could be disabled.
 *
 * Both fields are date fields added to portal_users by hand in the admin.
 * Best-effort: a failure here must never block someone from signing in.
 */
export async function recordLogin(userId: string, { activated = false }: { activated?: boolean } = {}) {
  const now = new Date().toISOString();
  try {
    const service = await getServiceClient();
    await service.collection("portal_users").update(userId, activated ? { last_login: now, activated_at: now } : { last_login: now });
  } catch (err) {
    console.error("Failed to record login for", userId, err);
  }
}
