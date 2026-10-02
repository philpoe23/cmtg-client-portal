"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { setInitialPassword, logout } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, type FormMessageState } from "@/components/form-message";

export default function SetupPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessageState>(null);

  async function handleSetPassword(e: React.FormEvent) {
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
      const result = await setInitialPassword(password, confirmPassword);
      if (!result.success) {
        track("account_setup_failed", { error: result.error });
        setMessage({ type: "error", text: result.error ?? "Failed to set password. Please try again." });
        return;
      }

      track("account_setup_complete", { email: result.email });
      setMessage({ type: "success", text: "Password set! Redirecting…" });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      track("account_setup_failed", { error: err instanceof Error ? err.message : String(err) });
      setMessage({ type: "error", text: "Failed to set password. Please try again." });
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
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage(null);
                  }} required />
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
              <Button type="submit" className="w-full" disabled={loading || message?.type === "success"}>
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
