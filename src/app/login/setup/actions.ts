"use server";

import PocketBase from "pocketbase";
import { createClient, persistAuthCookie, clearAuthCookie } from "@/lib/pocketbase/server";
import { getServiceClient } from "@/lib/pocketbase/service";

/**
 * Sets the password for an account that's signed in but not yet set up
 * (an invited user who came in with their emailed code), marks it verified,
 * and persists the new session server-side (document.cookie can't reliably
 * do this once a cookie of this name is already httpOnly).
 *
 * The user never knew the password PocketBase was created with, so this
 * can't go through a self-service update (that needs oldPassword). The
 * signed-in, still-unverified session is the proof instead.
 */
export async function setInitialPassword(password: string, passwordConfirm: string): Promise<{ success: boolean; error?: string; email?: string }> {
  if (password !== passwordConfirm) return { success: false, error: "Passwords do not match" };
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters" };

  const sessionPb = await createClient();
  let userId: string;
  let email: string;
  try {
    const refreshed = await sessionPb.collection("portal_users").authRefresh();
    if (refreshed.record.verified) {
      return { success: false, error: "Your account is already set up." };
    }
    userId = refreshed.record.id;
    email = refreshed.record.email as string;
  } catch {
    return { success: false, error: "Your session has expired. Please use the link in your invite email again." };
  }

  const service = await getServiceClient();
  try {
    await service.collection("portal_users").update(userId, { password, passwordConfirm });
  } catch {
    return { success: false, error: "That password wasn't accepted. Please choose a different one." };
  }

  // Changing the password invalidated the old session, so sign in again with the new one
  const userPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  await userPb.collection("portal_users").authWithPassword(email, password);
  await service.collection("portal_users").update(userId, { verified: true });
  await userPb.collection("portal_users").authRefresh();
  await persistAuthCookie(userPb);

  return { success: true, email };
}

export async function logout() {
  await clearAuthCookie();
}
