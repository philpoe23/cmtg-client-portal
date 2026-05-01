import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LogoutButton from "./logout-button";
import type { Account } from "@/types";

interface HeaderProps {
  user: { id: string; email: string };
  account: Account;
}

export default function Header({ user, account }: HeaderProps) {
  return (
    <header className="h-13 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
      <p className="text-sm font-medium">{account.company_name}</p>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs">
              <User size={13} />
              {user.email}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <LogoutButton />
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
