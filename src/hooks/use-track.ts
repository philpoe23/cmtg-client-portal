"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";

interface TrackOptions {
  event_type: "page_view" | "click" | "filter" | "search" | "export" | string;
  event_name: string;
  metadata?: Record<string, unknown>;
}

export function useTrack() {
  const pathname = usePathname();

  const track = useCallback(
    async ({ event_type, event_name, metadata }: TrackOptions) => {
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
