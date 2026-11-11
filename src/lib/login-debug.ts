import { ClientResponseError } from "pocketbase";

/**
 * Login debugging: when NEXT_PUBLIC_DEBUG_LOGIN=true, a failed sign-in shows
 * the underlying error details on the login page instead of only the
 * user-facing toast. NEXT_PUBLIC_ values are baked in at build time, so
 * toggling it needs a rebuild. Leave it off in normal use — it exposes
 * server URLs and error internals to anyone on the login page.
 */
export const LOGIN_DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOGIN === "true";

export interface LoginDebugInfo {
  step: string;
  time: string;
  [key: string]: unknown;
}

function describeCause(err: unknown): unknown {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(err.cause !== undefined ? { cause: describeCause(err.cause) } : {}),
    };
  }
  return err;
}

export function describeLoginError(step: string, err: unknown, extra: Record<string, unknown> = {}): LoginDebugInfo {
  const base = { step, time: new Date().toISOString(), ...extra };

  if (err instanceof ClientResponseError) {
    return {
      ...base,
      kind: "PocketBase response error",
      // status 0 means no HTTP response arrived at all: network failure,
      // blocked request (mixed content / CORS), DNS, or the proxy is down.
      status: err.status,
      noResponse: err.status === 0,
      url: err.url,
      message: err.message,
      response: err.response,
      isAbort: err.isAbort,
      originalError: describeCause(err.originalError),
    };
  }

  return { ...base, kind: "Error", error: describeCause(err) };
}
