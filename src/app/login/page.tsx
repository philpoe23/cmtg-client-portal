"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { verifyTotpLogin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";
import pb from "@/lib/pocketbase";

type Step = "credentials" | "mfa";

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

      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax" });
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

  if (step === "mfa") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 px-8 text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Verification Code</h1>
              <p className="text-muted-foreground text-base">We sent a 6-digit code to your device.</p>
            </div>

            <form onSubmit={handleMfa} className="space-y-6">
              <OtpInput value={totpCode} onChange={setTotpCode} disabled={loading} />

              <Button type="submit" size="lg" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={loading || totpCode.length !== 6}>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Client Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to view your support tickets</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>

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
      </div>
    </div>
  );
}
