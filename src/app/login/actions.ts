"use server";

import PocketBase from "pocketbase";
import { persistAuthCookie } from "@/lib/pocketbase/server";
import { getServiceClient } from "@/lib/pocketbase/service";
import { verifyTotpCode } from "@/lib/server/totp";

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
  return true;
}
