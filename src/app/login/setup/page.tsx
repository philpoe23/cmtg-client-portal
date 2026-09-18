"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/pocketbase/client";
import { completeAccountSetup, logout } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientResponseError } from "pocketbase";

export default function SetupPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const userId = pb.authStore.record?.id as string;

      await pb.collection("portal_users").update(userId, {
        password,
        passwordConfirm: confirmPassword,
        oldPassword: currentPassword,
      });

      // Re-authenticate with the new password so we have a fresh, valid token
      // (changing the password invalidates the old one)
      await pb.collection("portal_users").authWithPassword(pb.authStore.record?.email as string, password);

      // Mark the account verified and persist the session server-side —
      // document.cookie can't do that once the cookie is httpOnly.
      const result = await completeAccountSetup(pb.authStore.token);
      if (!result.success) {
        toast.error(result.error ?? "Failed to complete setup. Please try again.");
        return;
      }

      toast.success("Password set! Redirecting…");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ClientResponseError) {
        console.error("Failed to set password:", err.response);
        toast.error("Failed to set password — make sure your temporary password is correct and the new password meets the requirements.");
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to set password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Account Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Set a password to complete your account</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Set Your Password</CardTitle>
            <CardDescription>Choose a strong password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Temporary Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
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
                {loading ? "Saving…" : "Set Password"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
              >
                Log out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
