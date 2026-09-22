"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * Wrapper around next-themes ThemeProvider.
 *
 * Do not gate this behind a `mounted` flag. next-themes always renders an
 * inline <script> that applies the stored theme before paint. Deferring the
 * provider to after hydration keeps that script out of the SSR HTML, so React
 * has to create the <script> node during a client render -- which both emits
 * "Encountered a script tag while rendering React component" and silently
 * drops the script (client-created scripts never execute). Rendering on the
 * server means the script ships in the HTML, runs, and hydrates cleanly.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
