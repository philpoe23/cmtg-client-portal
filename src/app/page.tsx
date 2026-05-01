import { redirect } from "next/navigation";

// Root redirects to /portal/dashboard (or /login via middleware if unauthenticated)
export default function RootPage() {
  redirect("/portal/dashboard");
}
