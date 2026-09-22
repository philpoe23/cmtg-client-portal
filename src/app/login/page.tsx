"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { verifyTotpLogin } from "./actions";
import { logout } from "./mfa-setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";
import { AuthShell } from "@/components/auth-shell";
import { StepFade } from "@/components/step-fade";
import { MfaEnrollment } from "@/components/mfa-enrollment";
import pb from "@/lib/pocketbase";
import Image from "next/image";

type Step = "credentials" | "mfa" | "mfa-setup";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection("portal_users").authWithPassword(email, password);

      if (pb.authStore.record?.totp_enabled) {
        // Password verified, but the session cookie is withheld until the
        // TOTP code checks out — that's what makes the code check load-bearing
        // for dashboard access rather than just a UI step.
        setStep("mfa");
        return;
      }

      // Enrollment runs inline from here on, and its server actions read auth
      // from the cookie, so this has to be written before the step changes.
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax" });

      if (pb.authStore.record?.verified) {
        // Verified but not enrolled: show enrollment in place rather than
        // letting the proxy bounce us to /login/mfa-setup.
        setStep("mfa-setup");
        return;
      }

      // First login, account not yet set up. Still a real navigation — the
      // proxy owns where an unverified session belongs (/login/setup).
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const valid = await verifyTotpLogin(pb.authStore.token, totpCode);
      if (!valid) {
        toast.error("Invalid code");
        return;
      }

      // The server action just persisted the verified session as an httpOnly
      // cookie directly — document.cookie can't do that once a cookie of this
      // name is already httpOnly, which it is for any returning user.
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Invalid code");
    } finally {
      setLoading(false);
    }
  }

  function toDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell>
      <StepFade
        stepKey={step}
        steps={{
          credentials: (
            <Card>
              <Image src="/images/logo.png" alt="Client Portal Logo" width={64} height={64} className="mx-auto mb-2 mt-8" />
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Client Portal</h1>
                <p className="text-muted-foreground text-sm mt-1">Sign in to view your support tickets</p>
              </div>

              <CardContent>
                <form onSubmit={handleCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ),

          mfa: (
            <Card>
              <CardContent className="pt-6 pb-8 px-8 text-center space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Verification Code</h1>
                  <p className="text-muted-foreground text-base">We sent a 6-digit code to your device.</p>
                </div>

                <form onSubmit={handleMfa} className="space-y-6">
                  <OtpInput value={totpCode} onChange={setTotpCode} disabled={loading} />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-foreground text-background hover:bg-foreground/90"
                    disabled={loading || totpCode.length !== 6}
                  >
                    {loading ? "Verifying…" : "Verify Account"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep("credentials");
                      setTotpCode("");
                    }}
                  >
                    Back
                  </Button>
                </form>
              </CardContent>
            </Card>
          ),

          "mfa-setup": (
            <MfaEnrollment
              onEnrolled={toDashboard}
              onLogout={async () => {
                await logout();
                // logout() only clears the server-side cookie; the browser
                // client keeps auth in memory, so without this the next step
                // would still hold a token for the account that signed out.
                pb.authStore.clear();
                setStep("credentials");
                setPassword("");
              }}
            />
          ),
        }}
      />
    </AuthShell>
  );
}
