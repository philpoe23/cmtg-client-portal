"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">500</h1>
        <p className="text-lg font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground max-w-sm">An unexpected error occurred. You can try again or contact support if the problem persists.</p>
        {error.digest && <p className="text-xs text-muted-foreground font-mono mt-1">Error ID: {error.digest}</p>}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/dashboard")}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
