"use server";

import PocketBase from "pocketbase";
import { persistAuthCookie } from "@/lib/pocketbase/server";
import { getServiceClient } from "@/lib/pocketbase/service";

const INVALID_CODE = "That code is invalid or has expired. Request a new one below.";

/**
 * Signs an invited user in with the PocketBase OTP from their invite email.
 *
 * Invite codes are only for accounts that haven't been set up yet — anyone
 * already verified signs in with password + 2FA, so this refuses them rather
 * than offering a way round their second factor.
 *
 * PocketBase marks the record verified on a successful OTP auth. The proxy
 * uses `verified` to mean "has chosen a password", so it's set back to false
 * here, and the user lands on /login/setup.
 */
export async function signInWithInviteCode(otpId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const service = await getServiceClient();

  let userId: string;
  try {
    const otp = await service.collection("_otps").getOne(otpId);
    const user = await service.collection("portal_users").getOne(otp.recordRef as string);
    if (user.verified) {
      return { success: false, error: "Your account is already set up. Sign in with your email and password." };
    }
    userId = user.id;
  } catch {
    return { success: false, error: INVALID_CODE };
  }

  const userPb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  try {
    await userPb.collection("portal_users").authWithOTP(otpId, code);
  } catch {
    return { success: false, error: INVALID_CODE };
  }

  await service.collection("portal_users").update(userId, { verified: false, otp_used: true });
  await userPb.collection("portal_users").authRefresh();
  await persistAuthCookie(userPb);

  return { success: true };
}

/**
 * Emails a fresh invite code. Only sent to accounts still waiting to be set
 * up; the reply is the same either way so it doesn't reveal which emails
 * have accounts.
 */
export async function requestInviteCode(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const service = await getServiceClient();

  try {
    const user = await service.collection("portal_users").getFirstListItem(service.filter("email = {:email}", { email: normalizedEmail }));
    if (user.verified || user.disabled) return;
    await service.collection("portal_users").requestOTP(normalizedEmail);
  } catch {
    // No such user, or the send failed — same reply to the caller either way
  }
}
