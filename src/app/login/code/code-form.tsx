"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestInviteCode, signInWithInviteCode } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";
import { AuthShell } from "@/components/auth-shell";
import { StepFade } from "@/components/step-fade";
import { track } from "@/lib/analytics";

// Matches portal_users → Options → OTP → length in PocketBase
const CODE_LENGTH = 8;

type Step = "code" | "request" | "sent";

export function CodeForm({ otpId }: { otpId: string }) {
  const router = useRouter();

  // Without an OTP id from the email link there's nothing to check a code against
  const [step, setStep] = useState<Step>(otpId ? "code" : "request");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithInviteCode(otpId, code);
      if (!result.success) {
        track("login_failed", { step: "invite_code", error: result.error });
        toast.error(result.error ?? "Sign in failed");
        return;
      }
      track("login", { method: "invite_code" });
      // The proxy sends an account that isn't set up yet to /login/setup
      router.push("/login/setup");
      router.refresh();
    } catch {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestInviteCode(email);
      setStep("sent");
    } catch {
      toast.error("Couldn't send a new code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <StepFade
        stepKey={step}
        steps={{
          code: (
            <Card>
              <CardContent className="pt-6 pb-8 px-8 text-center space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Enter your code</h1>
                  <p className="text-muted-foreground text-base">Type the {CODE_LENGTH}-digit code from your email to set up your account.</p>
                </div>

                <form onSubmit={handleCode} className="space-y-6">
                  <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} disabled={loading} />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-foreground text-background hover:bg-foreground/90"
                    disabled={loading || code.length !== CODE_LENGTH}
                  >
                    {loading ? "Checking…" : "Continue"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("request")}>
                    Send me a new code
                  </Button>
                </form>
              </CardContent>
            </Card>
          ),

          request: (
            <Card>
              <CardContent className="pt-6 pb-8 px-8 space-y-6">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tight">Get a new code</h1>
                  <p className="text-muted-foreground text-base">Enter the email address your invite was sent to.</p>
                </div>

                <form onSubmit={handleRequest} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Email me a code"}
                  </Button>
                  <Button render={<Link href="/login" />} variant="ghost" className="w-full">
                    Back to sign in
                  </Button>
                </form>
              </CardContent>
            </Card>
          ),

          sent: (
            <Card>
              <CardContent className="pt-6 pb-8 px-8 text-center space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
                  <p className="text-muted-foreground text-base">
                    If {email} has an account waiting to be set up, we&apos;ve sent it a new code. Use the Sign in button in that email.
                  </p>
                </div>
                <Button render={<Link href="/login" />} variant="ghost" className="w-full">
                  Back to sign in
                </Button>
              </CardContent>
            </Card>
          ),
        }}
      />
    </AuthShell>
  );
}
