"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseIcon,
  BuildingIcon,
  ChevronRightIcon,
  FileTextIcon,
  MapPinIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { isNavGroup, type NavGroup, type NavItem, type NavLink } from "@/lib/navigation";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "plus-circle": PlusCircleIcon,
  briefcase: BriefcaseIcon,
  "file-text": FileTextIcon,
  "map-pin": MapPinIcon,
  building: BuildingIcon,
  shield: ShieldCheckIcon,
  wrench: WrenchIcon,
};

type SidebarProps = {
  navItems: NavItem[];
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function linkClassName(active: boolean, extra?: string) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-primary text-white"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
    extra
  );
}

function NavLinkItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const Icon = ICON_MAP[item.icon];
  return (
    <Link href={item.href} className={linkClassName(isActivePath(pathname, item.href))}>
      {Icon && <Icon className="size-4 shrink-0" />}
      {item.label}
    </Link>
  );
}

function NavGroupItem({ item, pathname }: { item: NavGroup; pathname: string }) {
  const Icon = ICON_MAP[item.icon];
  const childActive = item.children.some((child) =>
    isActivePath(pathname, child.href)
  );
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          childActive
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
        )}
        aria-expanded={open}
      >
        {Icon && <Icon className="size-4 shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {item.children.map((child) => {
            const ChildIcon = ICON_MAP[child.icon];
            return (
              <Link
                key={child.href}
                href={child.href}
                className={linkClassName(
                  isActivePath(pathname, child.href),
                  "py-2 pl-10"
                )}
              >
                {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        {navItems.map((item) =>
          isNavGroup(item) ? (
            <NavGroupItem key={item.label} item={item} pathname={pathname} />
          ) : (
            <NavLinkItem key={item.href} item={item} pathname={pathname} />
          )
        )}
      </nav>
    </aside>
  );
}
