"use server";

import PocketBase from "pocketbase";
import { persistAuthCookie, clearAuthCookie } from "@/lib/pocketbase/server";
import { getServiceClient } from "@/lib/pocketbase/service";

/**
 * Marks the account verified now that the user has proven ownership by
 * successfully changing their temporary password, and persists the
 * resulting session server-side (document.cookie can't reliably do this
 * once a cookie of this name is already httpOnly).
 *
 * `token` is the freshly-issued auth token from re-authenticating with the
 * new password — changing a password invalidates prior tokens, so this
 * can't reuse the pre-change session.
 */
export async function completeAccountSetup(token: string): Promise<{ success: boolean; error?: string }> {
  const userPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  userPb.authStore.save(token, null);
  if (!userPb.authStore.isValid) {
    return { success: false, error: "Your session has expired. Please refresh and sign in again." };
  }

  let userId: string;
  try {
    const refreshed = await userPb.collection("portal_users").authRefresh();
    userId = refreshed.record.id;
  } catch {
    return { success: false, error: "Your session has expired. Please refresh and sign in again." };
  }

  const service = await getServiceClient();
  await service.collection("portal_users").update(userId, { verified: true });

  await userPb.collection("portal_users").authRefresh();
  await persistAuthCookie(userPb);

  return { success: true };
}

export async function logout() {
  await clearAuthCookie();
}
