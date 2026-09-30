"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/service-summary-report", label: "Service Summary Report", icon: Ticket },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <span className="font-heading font-semibold text-sm text-foreground">Client Portal</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors",
              pathname.startsWith(href) ? "bg-secondary font-semibold text-primary" : "text-cmtg-body hover:bg-foreground/6 hover:text-foreground",
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
