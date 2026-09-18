"use server";

import { createClient, persistAuthCookie, clearAuthCookie } from "@/lib/pocketbase/server";
import { getServiceClient } from "@/lib/pocketbase/service";
import { generateSecret, generateEnrollmentQrCode, verifyTotpCode } from "@/lib/server/totp";

interface EnrollmentStart {
  qrCodeDataUrl: string;
  secret: string;
}

export async function startTotpEnrollment(): Promise<EnrollmentStart | null> {
  const pb = await createClient();
  const userId = pb.authStore.record?.id as string | undefined;
  const email = pb.authStore.record?.email as string | undefined;
  if (!userId || !email) return null;

  const service = await getServiceClient();
  const record = await service.collection("portal_users").getOne(userId);

  const secret = (record.totp_secret as string | undefined) || generateSecret();
  if (!record.totp_secret) {
    await service.collection("portal_users").update(userId, { totp_secret: secret });
  }

  const qrCodeDataUrl = await generateEnrollmentQrCode(secret, email);
  return { qrCodeDataUrl, secret };
}

export async function confirmTotpEnrollment(code: string): Promise<{ success: boolean; error?: string }> {
  const pb = await createClient();
  const userId = pb.authStore.record?.id as string | undefined;
  const email = pb.authStore.record?.email as string | undefined;
  if (!userId || !email) {
    return { success: false, error: "Your session has expired. Please refresh and sign in again." };
  }

  const service = await getServiceClient();
  const record = await service.collection("portal_users").getOne(userId);
  const secret = record.totp_secret as string | undefined;
  if (!secret) {
    return { success: false, error: "Enrollment session not found. Please restart setup." };
  }

  if (!verifyTotpCode(secret, email, code)) {
    return { success: false, error: "Invalid code. Please try again." };
  }

  await service.collection("portal_users").update(userId, { totp_enabled: true });

  // Refresh this session's own record (now reflecting totp_enabled) and
  // persist it server-side — client-side document.cookie can't do this
  // once the cookie is httpOnly, which it already is for any returning user.
  await pb.collection("portal_users").authRefresh();
  await persistAuthCookie(pb);

  return { success: true };
}

export async function logout() {
  await clearAuthCookie();
}
