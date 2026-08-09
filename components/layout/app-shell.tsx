"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { getNavItemsForRoles } from "@/lib/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AppRole } from "@/lib/roles";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();

  const role: AppRole = user?.role ?? "user";
  const navItems = getNavItemsForRoles([role]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          userName={loading ? undefined : (user?.full_name ?? undefined)}
          userEmail={loading ? undefined : (user?.email ?? undefined)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
