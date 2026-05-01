import PocketBase from "pocketbase";
import { cookies } from "next/headers";

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
