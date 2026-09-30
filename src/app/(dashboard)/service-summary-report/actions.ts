"use server";

import { getAccountUser } from "@/lib/server/get-account";
import type { HourType } from "@/types";

/** Company name plus the account's hour_type, resolved in one round trip. */
export async function fetchReportAccount(): Promise<{ companyName: string; hourType: HourType } | null> {
  const account = await getAccountUser();
  if (!account?.accounts?.company_name) return null;
  return { companyName: account.accounts.company_name, hourType: account.accounts.hour_type };
}

export async function fetchCompanyName(): Promise<string | null> {
  const account = await getAccountUser();
  return account?.accounts?.company_name ?? null;
}
