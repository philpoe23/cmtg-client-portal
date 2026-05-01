"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/pocketbase/client";
import { ClientResponseError } from "pocketbase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "credentials" | "mfa";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaId, setMfaId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pb = createClient();
      await pb.collection("accounts").authWithPassword(email, password);
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax" });
      router.push("/portal/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ClientResponseError && err.response?.mfaId) {
        setMfaId(err.response.mfaId as string);
        setStep("mfa");
      } else {
        toast.error(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pb = createClient();
      await pb.collection("accounts").authWithOTP(mfaId!, totpCode);
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax" });
      router.push("/portal/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-base">{step === "credentials" ? "Sign In" : "Two-Factor Authentication"}</CardTitle>
            <CardDescription>
              {step === "credentials" ? "Enter your email and password to continue" : "Enter the 6-digit code from your authenticator app"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "credentials" ? (
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
            ) : (
              <form onSubmit={handleMfa} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totp">Authenticator Code</Label>
                  <Input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
                  {loading ? "Verifying…" : "Verify"}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
