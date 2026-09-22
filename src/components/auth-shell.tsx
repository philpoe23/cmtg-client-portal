import type { ReactNode } from "react";

/**
 * Backdrop shared by every screen in the login flow.
 *
 * Kept in one place so /login and /login/mfa-setup cannot drift apart -- a
 * resumed enrollment has to look identical to the inline one, or the "it never
 * left the page" effect breaks the moment someone reloads.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-background p-4 bg-no-repeat bg-center bg-cover"
      style={{ backgroundImage: "url('/images/bg.png')" }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#0A7171] to-transparent opacity-50" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
