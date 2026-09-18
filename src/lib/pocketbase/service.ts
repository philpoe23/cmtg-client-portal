import PocketBase from "pocketbase";

let client: PocketBase | null = null;

/**
 * Server-only PocketBase client authenticated as a superuser.
 * Used to read/write fields (like the hidden TOTP secret) that are
 * never exposed to regular users via the API. Never import this from
 * client-facing code.
 */
export async function getServiceClient(): Promise<PocketBase> {
  if (!client) {
    client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
  }

  if (!client.authStore.isValid) {
    await client.collection("_superusers").authWithPassword(process.env.SUPERUSER_EMAIL!, process.env.SUPERUSER_PASSWORD!);
  }

  return client;
}
