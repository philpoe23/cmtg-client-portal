"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/pocketbase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SetupStep = "password" | "mfa";

export default function SetupPage() {
  const router = useRouter();

  const [step, setStep] = useState<SetupStep>("password");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const pb = createClient();
      const userId = pb.authStore.model?.id as string;

      await pb.collection("accounts").update(userId, {
        password,
        passwordConfirm: confirmPassword,
        oldPassword: "",
      });

      // Request TOTP enrollment — returns { id, totpUri, secret }
      const enrollment = await (pb.collection("accounts") as any).requestTOTPEnrollment();
      setEnrollmentId(enrollment.id as string);
      setQrCode(enrollment.totpUri as string);
      setSecret(enrollment.secret as string);
      setStep("mfa");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pb = createClient();
      await pb.collection("accounts").authWithOTP(enrollmentId, totpCode);
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax" });
      toast.success("Setup complete! Redirecting…");
      router.push("/portal/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code — try again");
      setTotpCode("");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["Set Password", "Enable MFA"];
  const stepIndex = step === "password" ? 0 : 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Account Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete your account before continuing</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                  i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </div>
              <span className={cn("text-sm", i <= stepIndex ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
              {i < steps.length - 1 && <span className="text-muted-foreground text-xs mx-1">→</span>}
            </div>
          ))}
        </div>

        {step === "password" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Set Your Password</CardTitle>
              <CardDescription>Choose a strong password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving…" : "Set Password & Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "mfa" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Enable Two-Factor Authentication</CardTitle>
              <CardDescription>Scan the QR code with Google Authenticator, Authy, or any TOTP app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {qrCode && (
                <div className="flex justify-center">
                  {/* QR code returned by PocketBase as a data URI */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="bg-white p-3 rounded-lg inline-block">
                    <img src={qrCode} alt="TOTP QR Code" width={168} height={168} />
                  </div>
                </div>
              )}
              {secret && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key manually:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono tracking-widest">{secret}</code>
                </div>
              )}
              <form onSubmit={handleVerifyTotp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totp">Verification Code</Label>
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
                  {loading ? "Verifying…" : "Verify & Complete Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
