import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-lg font-medium">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-sm">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      </div>
      <Button render={<Link href="/dashboard" />} variant="outline">
        Go to dashboard
      </Button>
    </div>
  );
}
