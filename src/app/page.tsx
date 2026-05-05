import { redirect } from "next/navigation";

// Root redirects to /dashboard (or /login via middleware if unauthenticated)
export default function RootPage() {
  redirect("/dashboard");
}
