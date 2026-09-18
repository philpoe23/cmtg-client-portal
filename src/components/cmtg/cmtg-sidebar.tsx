import { cn } from "@/lib/utils";

export interface CmtgNavItem {
  label: string;
  href: string;
}

export interface CmtgSidebarProps {
  navItems: CmtgNavItem[];
  /** Href of the currently active nav item. */
  activeHref: string;
  user: {
    initials: string;
    name: string;
    company: string;
  };
  className?: string;
}

export function CmtgSidebar({ navItems, activeHref, user, className }: CmtgSidebarProps) {
  return (
    <div className={cn("flex h-full w-58 shrink-0 flex-col gap-7 bg-[#0B2E2C] px-4.5 py-7", className)}>
      <div className="flex items-center gap-2.5 px-1.5">
        <svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M20 3L34 17L20 31L6 17Z" stroke="#FFFFFF" strokeWidth="2.8" />
          <path d="M20 11L26 17L20 23L14 17Z" stroke="#FFFFFF" strokeWidth="2.8" />
        </svg>
        <span className="font-blueprint text-[17px] font-bold text-white">CMTG</span>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 font-sans text-sm text-[#CFEAE7] no-underline transition-colors hover:bg-white/8",
                isActive && "bg-white/12 font-semibold text-white",
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 rounded-[10px] bg-white/6 p-3">
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-cmtg-blue-green text-xs font-semibold text-white">
          {user.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">{user.name}</div>
          <div className="truncate text-xs text-[#8FB6B3]">{user.company}</div>
        </div>
      </div>
    </div>
  );
}
