"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { EulaGate } from "@/components/legal/eula-gate";
import { getNavItemsForRoles } from "@/lib/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AppRole } from "@/lib/roles";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useCurrentUser();

  const role: AppRole = user?.role ?? "user";
  const navItems = getNavItemsForRoles([role]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-7 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (user && !user.eula_accepted) {
    return (
      <EulaGate
        isUpdate={Boolean(user.eula_accepted_at)}
        onAccepted={refresh}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          userName={user?.full_name ?? undefined}
          userEmail={user?.email ?? undefined}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
