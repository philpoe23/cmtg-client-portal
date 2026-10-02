"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";
import { FormMessage, type FormMessageState } from "@/components/form-message";
import pb from "@/lib/pocketbase";
import { track } from "@/lib/analytics";

/**
 * Landing page for the PocketBase password reset email
 * (portal_users → Options → Password reset template links here with {TOKEN}).
 */
export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessageState>(null);
  const done = message?.type === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await pb.collection("portal_users").confirmPasswordReset(token, password, confirmPassword);
      track("password_reset_complete");
      setMessage({ type: "success", text: "Your password has been changed. You can now sign in with your new password." });
    } catch {
      track("password_reset_failed");
      setMessage({ type: "error", text: "This reset link is invalid or has expired. Ask your CMTG contact for a new one." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardContent className="pt-6 pb-8 px-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{done ? "Password changed" : "Reset your password"}</h1>
            {!done && (
              <p className="text-muted-foreground text-base">
                {token ? "Choose a new password for your account." : "This reset link is incomplete. Open it again from your email."}
              </p>
            )}
          </div>

          {done ? (
            <div className="space-y-4">
              <FormMessage message={message} />
              <Button render={<Link href="/login" />} className="w-full">
                Sign in
              </Button>
            </div>
          ) : (
            <>
              {token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setMessage(null);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm Password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setMessage(null);
                      }}
                      required
                    />
                  </div>
                  <FormMessage message={message} />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving…" : "Set New Password"}
                  </Button>
                </form>
              )}

              <Button render={<Link href="/login" />} variant="ghost" className="w-full">
                Back to sign in
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
