"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { EulaGate } from "@/components/legal/eula-gate";
import { getNavItemsForRoles } from "@/lib/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AppRole } from "@/lib/roles";

const STORAGE_KEY = "sidebar";
const DESKTOP_QUERY = "(min-width: 992px)";

function readContracted() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "contracted";
  } catch {
    return false;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useCurrentUser();
  const [contracted, setContracted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [ready, setReady] = useState(false);

  const role: AppRole = user?.role ?? "user";
  const navItems = getNavItemsForRoles([role]);

  useEffect(() => {
    setContracted(readContracted());
    setReady(true);
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (contracted) {
        window.localStorage.setItem(STORAGE_KEY, "contracted");
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Private mode can block localStorage; the sidebar still works.
    }
  }, [contracted, ready]);

  function toggleSidebar() {
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    if (!desktop) {
      setMobileOpen((open) => !open);
      return;
    }
    setContracted((value) => !value);
  }

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
    <div className="sb-layout">
      <div
        className="sb-backdrop"
        hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />
      <Sidebar
        navItems={navItems}
        contracted={contracted}
        mobileOpen={mobileOpen}
        animate={animate}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="sb-content">
        <TopBar
          userName={user?.full_name ?? undefined}
          userEmail={user?.email ?? undefined}
          onToggleSidebar={toggleSidebar}
        />
        <main className="sb-page">{children}</main>
      </div>
    </div>
  );
}
