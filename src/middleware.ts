import PocketBase from "pocketbase";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  const isPortal = pathname.startsWith("/portal");
  const isSetupPage = pathname === "/login/setup";
  const isLoginArea = pathname.startsWith("/login");

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!pb.authStore.isValid) {
    if (isPortal || pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (isSetupPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
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

  // Fully set up: redirect away from auth area and root
  if (isLoginArea || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/dashboard";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  // Propagate any auth cookie updates
  response.headers.append("Set-Cookie", pb.authStore.exportToCookie({ httpOnly: true, secure: true, sameSite: "Lax" }));
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
