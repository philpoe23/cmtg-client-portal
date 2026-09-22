"use client";

import { useRouter } from "next/navigation";
import { logout } from "./actions";
import { AuthShell } from "@/components/auth-shell";
import { MfaEnrollment } from "@/components/mfa-enrollment";

/**
 * Standalone enrollment. /login runs the same card inline straight after
 * sign-in; this route is where the proxy sends an authenticated-but-unenrolled
 * session, which is what a reload mid-enrollment produces — the browser client
 * keeps auth in memory only, so /login cannot tell on its own.
 */
export default function MfaSetupPage() {
  const router = useRouter();

  return (
    <AuthShell>
      <MfaEnrollment
        onEnrolled={() => {
          router.push("/dashboard");
          router.refresh();
        }}
        onLogout={async () => {
          await logout();
          router.push("/login");
        }}
      />
    </AuthShell>
  );
}
