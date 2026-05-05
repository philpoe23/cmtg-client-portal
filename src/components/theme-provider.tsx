"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { useState, useEffect } from "react";

/**
 * Wrapper around next-themes ThemeProvider that defers rendering until after
 * hydration. This prevents next-themes from rendering its inline <script>
 * element in React's client component tree, which causes a React 19 warning.
 * FOUC prevention is handled separately by /theme-init.js via beforeInteractive.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  // nonce="" prevents next-themes from injecting its own inline script;
  // FOUC prevention is handled by /theme-init.js loaded via beforeInteractive.
  return (
    <NextThemesProvider nonce="" {...props}>
      {children}
    </NextThemesProvider>
  );
}
