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

  return {
    id: model["id"] as string,
    account_id: model["id"] as string,
    user_id: model["id"] as string,
    email: model["email"] as string,
    role: (model["role"] as "admin" | "viewer") ?? "viewer",
    otp_used: (model["otp_used"] as boolean) ?? false,
    created_at: model["created"] as string,
    accounts: {
      id: model["id"] as string,
      cw_company_recid: model["cw_company_recid"] as number,
      company_name: model["company_name"] as string,
      is_active: (model["is_active"] as boolean) ?? true,
      created_at: model["created"] as string,
    },
  };
});
