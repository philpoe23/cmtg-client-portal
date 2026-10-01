// Thin wrapper around the Umami tracker (loaded by <Umami /> in the root
// layout). Calls made before the script loads are queued and flushed on load,
// and every call is a silent no-op when Umami isn't configured or is blocked —
// analytics must never break the UX.

type EventValue = string | number | boolean | null | undefined;
export type EventData = Record<string, EventValue>;

interface UmamiTracker {
  track: {
    (eventName: string, data?: Record<string, string | number | boolean>): void;
    (props: (p: Record<string, unknown>) => Record<string, unknown>): void;
  };
  identify: (uniqueId: string, data?: Record<string, string | number | boolean>) => void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

const queue: ((u: UmamiTracker) => void)[] = [];

// Umami caps string values at 500 chars; also drops null/undefined so the
// dashboard doesn't fill up with empty properties.
function clean(data?: EventData): Record<string, string | number | boolean> | undefined {
  if (!data) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = typeof value === "string" ? value.slice(0, 500) : value;
  }
  return out;
}

function run(fn: (u: UmamiTracker) => void) {
  if (typeof window === "undefined") return;
  if (window.umami) {
    try {
      fn(window.umami);
    } catch {
      // ignore
    }
  } else {
    queue.push(fn);
  }
}

/** Called once the Umami script has loaded. */
export function flushAnalyticsQueue() {
  const umami = typeof window !== "undefined" ? window.umami : undefined;
  if (!umami) return;
  for (const fn of queue.splice(0)) {
    try {
      fn(umami);
    } catch {
      // ignore
    }
  }
}

/** Send a custom event. Event names are capped at 50 chars by Umami. */
export function track(eventName: string, data?: EventData) {
  const payload = clean(data);
  run((u) => u.track(eventName.slice(0, 50), payload));
}

/** Tie the current session to a portal user so their events show up under them. */
export function identify(userId: string, data?: EventData) {
  const payload = clean(data);
  run((u) => u.identify(userId, payload));
}
