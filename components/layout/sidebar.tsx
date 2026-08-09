"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseIcon, BuildingIcon, FileTextIcon, MapPinIcon, PlusCircleIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "plus-circle": PlusCircleIcon,
  briefcase: BriefcaseIcon,
  "file-text": FileTextIcon,
  "map-pin": MapPinIcon,
  building: BuildingIcon,
};

type SidebarProps = {
  navItems: NavItem[];
};

export function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
        <BrandLogo className="w-[90%] translate-x-[6%]" priority />
        <p className="text-xs text-sidebar-foreground/60">
          Aviation Intelligence
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4">
        <p className="text-xs text-sidebar-foreground/40">Version 1.0.0</p>
      </div>
    </aside>
  );
}
