"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { startTotpEnrollment, confirmTotpEnrollment } from "@/app/login/mfa-setup/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OtpInput } from "@/components/ui/otp-input";
import { Loader2 } from "lucide-react";

interface MfaEnrollmentProps {
  /** Called once the code is confirmed and the session cookie has been
   *  re-persisted server-side. The card stays in its "redirecting" state
   *  afterwards, so the caller is expected to navigate away. */
  onEnrolled: () => void;
  onLogout: () => void | Promise<void>;
}

/**
 * TOTP enrollment card: QR code, manual-entry key, and the confirming code.
 *
 * Rendered both inline on /login straight after sign-in and standalone on
 * /login/mfa-setup, which is where the proxy sends anyone who abandons
 * enrollment and comes back.
 */
export function MfaEnrollment({ onEnrolled, onLogout }: MfaEnrollmentProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    startTotpEnrollment()
      .then((result) => {
        if (!result) {
          toast.error("Your session has expired. Please refresh and sign in again.");
          return;
        }
        setQrCodeDataUrl(result.qrCodeDataUrl);
        setSecret(result.secret);
      })
      .catch(() => toast.error("Failed to start setup. Please refresh and try again."))
      .finally(() => setLoadingEnrollment(false));
  }, []);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    try {
      const result = await confirmTotpEnrollment(code);
      if (!result.success) {
        toast.error(result.error ?? "Invalid code. Please try again.");
        setVerifying(false);
        return;
      }

      // Stay in a visibly "busy" state until the browser actually finishes
      // navigating — router.push() returns immediately, it doesn't wait for
      // the destination page, so clearing this here would leave the old
      // screen sitting there looking frozen while /dashboard loads.
      setRedirecting(true);
      toast.success("Two-factor authentication enabled!");
      onEnrolled();
    } catch {
      toast.error("Failed to verify code. Please try again.");
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="py-4 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set Up Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-sm mt-1">Required to access the client portal</p>
        </div>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Scan the QR Code</CardTitle>
          <CardDescription>
            Scan this with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the code it generates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirecting ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
            </div>
          ) : loadingEnrollment ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-48 mx-auto" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : qrCodeDataUrl ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated per-request, nothing for next/image to optimise */}
              <img src={qrCodeDataUrl} alt="Authenticator QR code" className="mx-auto h-48 w-48 rounded-md border border-border" />

              {secret && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key manually</Label>
                  <p className="font-mono text-xs break-all bg-muted rounded-md px-2 py-1.5">{secret}</p>
                </div>
              )}

              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-center block">Authenticator Code</Label>
                  <OtpInput value={code} onChange={setCode} disabled={verifying} />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                  disabled={verifying || code.length !== 6}
                >
                  {verifying ? "Verifying…" : "Verify Account"}
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Unable to load setup. Please refresh the page.</p>
          )}

          {!redirecting && (
            <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => void onLogout()}>
              Log out
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
