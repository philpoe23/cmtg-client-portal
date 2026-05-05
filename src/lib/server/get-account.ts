import { cache } from "react";
import { createClient } from "@/lib/pocketbase/server";
import { DEV_BYPASS, DEV_MOCK_ACCOUNT_USER } from "@/lib/dev-bypass";
import type { AccountUser } from "@/types";

/**
 * Fetch the current user's account record from PocketBase authStore.
 * Wrapped in React `cache()` so multiple server components in the same
 * render pass share a single auth round-trip.
 */
export const getAccountUser = cache(async (): Promise<AccountUser | null> => {
  if (DEV_BYPASS) return DEV_MOCK_ACCOUNT_USER;

  const pb = await createClient();

  if (!pb.authStore.isValid || !pb.authStore.model) return null;

  const model = pb.authStore.model;

  // Expand the `account` relation to retrieve cw_company_recid from the
  // linked accounts record (portal_users.account → accounts.cw_company_recid).
  // portal_users.account has maxSelect=0, so PocketBase expands it as an array.
  const portalUser = await pb.collection("portal_users").getOne(model["id"] as string, { expand: "account" });

  const expandData = portalUser.expand as Record<string, unknown> | undefined;
  const accountRaw = expandData?.account;
  const account = (Array.isArray(accountRaw) ? accountRaw[0] : accountRaw) as Record<string, unknown> | undefined;

  if (!account) return null;

  return {
    id: portalUser["id"] as string,
    account_id: account["id"] as string,
    user_id: portalUser["id"] as string,
    email: portalUser["email"] as string,
    role: (portalUser["role"] as "viewer" | "manager") ?? "viewer",
    otp_used: (portalUser["otp_used"] as boolean) ?? false,
    created_at: portalUser["created"] as string,
    accounts: {
      id: account["id"] as string,
      cw_company_recid: account["cw_company_recid"] as number,
      company_name: account["company_name"] as string,
      is_active: (account["is_active"] as boolean) ?? true,
      created_at: account["created"] as string,
    },
  };
});
