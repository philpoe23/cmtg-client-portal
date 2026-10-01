"use client";

import { useEffect } from "react";
import Script from "next/script";
import { flushAnalyticsQueue, track } from "@/lib/analytics";

const SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

const CLICKABLE = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="switch"]';

function labelFor(el: HTMLElement): string {
  const label = el.dataset.trackLabel || el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "";
  return label.replace(/\s+/g, " ").trim().slice(0, 80) || el.tagName.toLowerCase();
}

/**
 * Loads the Umami tracker (pageviews, including client-side navigations, are
 * tracked automatically) and records a generic `click` event for every
 * button/link/tab/menu item, so there's a full click trail without tagging
 * each element by hand. Add `data-track-label` to an element to override its
 * label, or `data-track-ignore` to an element (or ancestor) to skip it.
 */
export function Umami() {
  useEffect(() => {
    if (!SCRIPT_URL || !WEBSITE_ID) return;

    function onClick(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target : null;
      const el = target?.closest<HTMLElement>(CLICKABLE);
      if (!el || el.closest("[data-track-ignore]")) return;

      track("click", {
        label: labelFor(el),
        element: el.getAttribute("role") || el.tagName.toLowerCase(),
        href: el instanceof HTMLAnchorElement ? el.getAttribute("href") : undefined,
        path: window.location.pathname,
      });
    }

    // Capture phase so clicks are seen even if a handler stops propagation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!SCRIPT_URL || !WEBSITE_ID) return null;

  return <Script src={SCRIPT_URL} data-website-id={WEBSITE_ID} strategy="afterInteractive" onLoad={flushAnalyticsQueue} />;
}
