"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/pocketbase/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    const pb = createClient();
    pb.authStore.clear();
    document.cookie = pb.authStore.exportToCookie({ expires: new Date(0) });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
      <LogOut size={14} className="mr-2" />
      Sign Out
    </DropdownMenuItem>
  );
}
