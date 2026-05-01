import PocketBase from "pocketbase";

export function createClient() {
  return new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL!);
}
