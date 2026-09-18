"use server";

import { createClient, clearAuthCookie } from "@/lib/pocketbase/server";
import { DEV_BYPASS, DEV_MOCK_ACCOUNT_USER } from "@/lib/dev-bypass";
import type { User } from "@/contexts/auth-context";

/**
 * Clears the httpOnly auth cookie on sign-out. Client code can't do this
 * itself — `document.cookie` writes to an httpOnly-named cookie are silently
 * ignored by the browser — so sign-out must go through the server too.
 */
export async function signOutServer(): Promise<void> {
  await clearAuthCookie();
}

/**
 * Resolves the signed-in portal_users record for the client-side auth
 * context. The auth cookie is httpOnly (see persistAuthCookie), so it is
 * invisible to client-side `document.cookie` reads — this server action is
 * how the client learns who is logged in.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (DEV_BYPASS) {
    return {
      id: DEV_MOCK_ACCOUNT_USER.id,
      first_name: "",
      last_name: "",
      name: DEV_MOCK_ACCOUNT_USER.email,
      email: DEV_MOCK_ACCOUNT_USER.email,
      accountName: DEV_MOCK_ACCOUNT_USER.accounts?.company_name ?? "",
    };
  }

  const pb = await createClient();
  if (!pb.authStore.isValid || !pb.authStore.model) return null;

  const model = pb.authStore.model;

  try {
    const portalUser = await pb.collection("portal_users").getOne(model["id"] as string, { expand: "account" });
    const expandData = portalUser.expand as Record<string, unknown> | undefined;
    const accountRaw = expandData?.account;
    const account = (Array.isArray(accountRaw) ? accountRaw[0] : accountRaw) as Record<string, unknown> | undefined;
    const firstName = (portalUser["first_name"] as string | undefined) || "";
    const lastName = (portalUser["last_name"] as string | undefined) || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || (portalUser["email"] as string) || "User";

    return {
      id: portalUser["id"] as string,
      first_name: firstName,
      last_name: lastName,
      name: displayName,
      email: (portalUser["email"] as string) || "",
      accountName: ((account?.["company_name"] as string | undefined) || "") as string,
    };
  } catch {
    const fallbackName = (model["name"] as string | undefined) || (model["email"] as string) || "User";
    return {
      id: model["id"] as string,
      first_name: (model["first_name"] as string | undefined) || "",
      last_name: (model["last_name"] as string | undefined) || "",
      name: fallbackName,
      email: (model["email"] as string) || "",
      accountName: "",
    };
  }
}
