import PocketBase from "pocketbase";
import { cookies, headers } from "next/headers";

/**
 * Browsers silently drop `Secure` cookies on non-HTTPS origins (localhost
 * excepted), so a hardcoded `secure: true` makes auth impossible on a plain
 * HTTP deployment. Follow the protocol the request actually arrived on.
 */
async function isSecureRequest(): Promise<boolean> {
  const headerStore = await headers();
  return (headerStore.get("x-forwarded-proto") ?? "http").split(",")[0].trim() === "https";
}

export async function createClient() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  const cookieStore = await cookies();
  const rawCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  pb.authStore.loadFromCookie(rawCookies);
  return pb;
}

/**
 * Writes the client's current auth state as an httpOnly cookie via Next's
 * cookies() API. Must be used (from a Server Action) instead of
 * `document.cookie` whenever the cookie might already be httpOnly — once a
 * cookie is set httpOnly, browsers silently ignore any later client-side
 * `document.cookie` write to that same name, so client code can never
 * refresh it again.
 */
export async function persistAuthCookie(pb: PocketBase) {
  const cookieStore = await cookies();
  const secure = await isSecureRequest();
  const exported = pb.authStore.exportToCookie({ httpOnly: true, secure, sameSite: "Lax" });
  const [nameValue] = exported.split("; ");
  const eq = nameValue.indexOf("=");
  cookieStore.set(nameValue.slice(0, eq), decodeURIComponent(nameValue.slice(eq + 1)), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Clears the auth cookie server-side — same httpOnly restriction as
 * persistAuthCookie applies: `document.cookie` cannot delete this cookie
 * once it's httpOnly, which it is for any returning user.
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("pb_auth");
}
