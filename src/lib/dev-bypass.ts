import type { AccountUser } from "@/types";

/**
 * True only in development when NEXT_PUBLIC_DEV_BYPASS_AUTH=true is set.
 * Works in both server and client components (NEXT_PUBLIC_ prefix).
 */
export const DEV_BYPASS = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export const DEV_MOCK_USER = {
  id: "dev-bypass-user",
  email: "dev@bypass.local",
};

export const DEV_MOCK_ACCOUNT_USER: AccountUser = {
  id: "dev-bypass-account-user",
  account_id: "dev-bypass-account",
  user_id: "dev-bypass-user",
  email: "dev@bypass.local",
  role: "admin",
  otp_used: false,
  created_at: new Date().toISOString(),
  accounts: {
    id: "dev-bypass-account",
    cw_company_recid: parseInt(process.env.NEXT_PUBLIC_DEV_BYPASS_CW_RECID ?? "0", 10),
    company_name: "Dev Bypass",
    is_active: true,
    created_at: new Date().toISOString(),
  },
};
