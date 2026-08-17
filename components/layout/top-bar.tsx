"use client";

import { useRouter } from "next/navigation";
import { UserIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

type TopBarProps = {
  userEmail?: string;
  userName?: string;
};

export function TopBar({ userEmail, userName }: TopBarProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const initials = userName
    ? userName.slice(0, 2).toUpperCase()
    : userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : "U";

  return (
    <header className="flex h-14 items-center justify-end border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-ring focus:ring-2">
              <Avatar className="size-8 cursor-pointer bg-primary text-white">
                <AvatarFallback className="bg-primary text-sm font-medium text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-medium">{userName || "User"}</span>
              {userEmail && (
                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <UserIcon className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
