"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter } from "@/components/ui/sidebar";
import { NavUser } from "@/components/ui/nav-user";
import { useAuth } from "@/contexts/auth-context";

// Assets/Reports/Billing/Settings from the CMTG mockup nav aren't implemented
// as real pages yet — only link to routes that exist.
const NAV_ITEMS = [
  // { title: "Dashboard", url: "/dashboard" },
  // { title: "Tickets", url: "/dashboard/tickets" },
  { title: "Service Summary Report", url: "/" },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const pathname = usePathname();

  const userData = {
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    name: user?.name || user?.email?.split("@")[0] || "",
    email: user?.email || "",
    accountName: user?.accountName || "",
    avatar: "",
  };

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-1 py-1">
              <img src="/images/logo.svg" alt="CMTG Logo" className="h-32 w-56" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.url === "/dashboard" ? pathname === item.url : pathname.startsWith(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={isActive} render={<a href={item.url} className="font-medium" />}>
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
