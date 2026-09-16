"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { GalleryVerticalEndIcon } from "lucide-react";
import { NavUser } from "@/components/ui/nav-user";
import { useAuth } from "@/contexts/auth-context";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
    },
    {
      title: "Service Summary Report",
      url: "/service-summary-report",
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

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
            <div className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-white-foreground">
                <img src="/images/logo.png" alt="Logo" className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-small">Client Portal</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton render={<a href={item.url} className="font-medium" />}>{item.title}</SidebarMenuButton>
                {/* {item.items?.length ? (
                  <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton isActive={item.isActive} render={<a href={item.url} />}>
                          {item.title}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null} */}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
