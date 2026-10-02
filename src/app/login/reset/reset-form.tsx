"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";
import pb from "@/lib/pocketbase";
import { track } from "@/lib/analytics";

/**
 * Landing page for the PocketBase password reset email
 * (portal_users → Options → Password reset template links here with {TOKEN}).
 */
export function ResetForm({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
      await pb.collection("portal_users").confirmPasswordReset(token, password, confirmPassword);
      track("password_reset_complete");
      toast.success("Password changed. Sign in with your new password.");
      router.push("/login");
    } catch {
      track("password_reset_failed");
      toast.error("This reset link is invalid or has expired. Ask your CMTG contact for a new one.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card>
        <CardContent className="pt-6 pb-8 px-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-muted-foreground text-base">
              {token ? "Choose a new password for your account." : "This reset link is incomplete. Open it again from your email."}
            </p>
          </div>

          {token && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? "Saving…" : "Set New Password"}
              </Button>
            </form>
          )}

          <Button render={<Link href="/login" />} variant="ghost" className="w-full">
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
