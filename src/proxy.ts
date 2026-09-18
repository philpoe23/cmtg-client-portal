import PocketBase from "pocketbase";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Skip all auth checks in dev bypass mode
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return NextResponse.next({ request });
  }

  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  const rawCookies = request.cookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  pb.authStore.loadFromCookie(rawCookies);

  const { pathname } = request.nextUrl;

  const isSetupPage = pathname === "/login/setup";
  const isMfaSetupPage = pathname === "/login/mfa-setup";
  const isLoginArea = pathname.startsWith("/login");

  // ── Unauthenticated ────────────────────────────────────────────────────────
  // Deny by default: anything that isn't the login flow itself requires a
  // session. Listing protected paths instead left every new route (/dashboard
  // included) publicly reachable until someone remembered to add it here.
  if (!pb.authStore.isValid) {
    // Route handlers answer with their own status codes; a redirect would turn
    // an honest 401 into a 200 page of HTML.
    if (pathname.startsWith("/api")) {
      return NextResponse.next({ request });
    }
    // The setup and MFA pages presuppose a session, so they are not entry points.
    if (isLoginArea && !isSetupPage && !isMfaSetupPage) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  // PocketBase uses a `verified` field to indicate the account is fully set up.
  const isVerified = pb.authStore.model?.verified ?? false;

  // First-login: authenticated but account not yet verified/set up
  if (!isVerified) {
    if (!isSetupPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/setup";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // Two-factor authentication is mandatory: verified but not yet enrolled
  const hasTotpEnabled = pb.authStore.model?.totp_enabled ?? false;
  if (!hasTotpEnabled) {
    if (!isMfaSetupPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/mfa-setup";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // Fully set up: redirect root to dashboard
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  // Propagate any auth cookie updates. `secure` follows the request's actual
  // protocol — browsers drop Secure cookies on plain-HTTP origins, which would
  // otherwise sign the user out on every request behind a non-TLS proxy.
  const isHttps = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")).split(",")[0].trim() === "https";
  response.headers.append("Set-Cookie", pb.authStore.exportToCookie({ httpOnly: true, secure: isHttps, sameSite: "Lax" }));
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
