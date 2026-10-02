"use server";

import PocketBase from "pocketbase";
import { persistAuthCookie } from "@/lib/pocketbase/server";
import { getServiceClient } from "@/lib/pocketbase/service";
import { verifyTotpCode } from "@/lib/server/totp";
import { recordLogin } from "@/lib/server/login-tracking";

/**
 * Persists the session from a password sign-in that still has to enrol in
 * 2FA, so the enrollment server actions can read it.
 *
 * This used to be written from the browser with document.cookie, which fails
 * silently in two cases: PocketBase's exportToCookie defaults to `Secure`
 * (dropped on a plain-HTTP origin), and a leftover httpOnly cookie of the
 * same name can't be overwritten from script. Either way the QR code never
 * loaded. Setting it server-side avoids both.
 */
export async function persistPasswordSession(token: string): Promise<boolean> {
  const userPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  userPb.authStore.save(token, null);
  if (!userPb.authStore.isValid) return false;

  try {
    await userPb.collection("portal_users").authRefresh();
  } catch {
    return false;
  }

  await persistAuthCookie(userPb);
  return true;
}

/**
 * Verifies a TOTP code for a user who just completed password auth.
 * `token` is the short-lived auth token from that password step (not yet
 * persisted to a cookie) — validating it here proves the caller actually
 * knows the password before we check the code against the stored secret.
 */
export async function verifyTotpLogin(token: string, code: string): Promise<boolean> {
  const userPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  userPb.authStore.save(token, null);
  if (!userPb.authStore.isValid) return false;

  let userId: string;
  let email: string;
  try {
    const refreshed = await userPb.collection("portal_users").authRefresh();
    userId = refreshed.record.id;
    email = refreshed.record.email as string;
  } catch {
    return false;
  }

  const service = await getServiceClient();
  const record = await service.collection("portal_users").getOne(userId);
  const secret = record.totp_secret as string | undefined;
  if (!secret) return false;

  if (!verifyTotpCode(secret, email, code)) return false;

  // Persist the now-verified session server-side — client-side document.cookie
  // can't do this once the cookie is httpOnly, which it already is for any
  // returning user after their first fully-authenticated request.
  await persistAuthCookie(userPb);
  await recordLogin(userId);
  return true;
}
