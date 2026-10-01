"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";
import { track as trackUmami, type EventData } from "@/lib/analytics";

interface TrackOptions {
  event_type: "page_view" | "click" | "filter" | "search" | "export" | string;
  event_name: string;
  metadata?: Record<string, unknown>;
}

export function useTrack() {
  const pathname = usePathname();

  const track = useCallback(
    async ({ event_type, event_name, metadata }: TrackOptions) => {
      // Umami only takes flat primitive values, so nested metadata is stringified.
      const flat: EventData = { event_type };
      for (const [key, value] of Object.entries(metadata ?? {})) {
        flat[key] = value === null || ["string", "number", "boolean"].includes(typeof value) ? (value as EventData[string]) : JSON.stringify(value);
      }
      trackUmami(event_name, flat);

      try {
        const pb = createClient();
        const model = pb.authStore.model;
        if (!model) return;

        await pb.collection("activity_logs").create({
          user_id: model["id"],
          account_id: model["id"],
          event_type,
          event_name,
          path: pathname,
          metadata: metadata ?? null,
        });
      } catch {
        // Tracking failures are silent — they must never break the UX
      }
    },
    [pathname],
  );

  return { track };
}
