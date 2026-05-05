"use server";

import { getAccountUser } from "@/lib/server/get-account";

export async function fetchCompanyName(): Promise<string | null> {
  const account = await getAccountUser();
  return account?.accounts?.company_name ?? null;
}
