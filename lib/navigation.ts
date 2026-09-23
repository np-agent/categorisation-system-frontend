import type { AppRole } from "@/lib/roles";
import { hasAnyRole, hasRole, isAdmin, isSuperAdmin } from "@/lib/roles";

export const ROLE_DEFAULT_ROUTES: Record<AppRole, string> = {
  user: "/user/jobs",
  admin: "/user/jobs",
  "super-admin": "/super-admin/templates",
};

export type NavLink = {
  label: string;
  href: string;
  roles: AppRole[];
  icon: string;
};

export type NavGroup = {
  label: string;
  icon: string;
  roles: AppRole[];
  children: NavLink[];
};

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Create New Job",
    href: "/user/create-job",
    roles: ["user", "admin", "super-admin"],
    icon: "plus-circle",
  },
  {
    label: "All Jobs",
    href: "/user/jobs",
    roles: ["user", "admin", "super-admin"],
    icon: "briefcase",
  },
  {
    label: "Manage Templates",
    href: "/super-admin/templates",
    roles: ["super-admin"],
    icon: "file-text",
  },
  {
    label: "Manage Airports",
    href: "/super-admin/airports",
    roles: ["super-admin"],
    icon: "map-pin",
  },
  {
    label: "Manage Organisations",
    href: "/super-admin/organisations",
    roles: ["super-admin"],
    icon: "building",
  },
  {
    label: "Administration",
    icon: "wrench",
    roles: ["super-admin"],
    children: [
      {
        label: "SelfBrief Team",
        href: "/super-admin/team",
        roles: ["super-admin"],
        icon: "shield",
      },
    ],
  },
];

export function getDefaultRouteForRoles(roles: AppRole[]) {
  if (isSuperAdmin(roles)) return ROLE_DEFAULT_ROUTES["super-admin"];
  if (isAdmin(roles)) return ROLE_DEFAULT_ROUTES.admin;
  if (hasRole(roles, "user")) return ROLE_DEFAULT_ROUTES.user;
  return "/user/jobs";
}

export function getNavItemsForRoles(roles: AppRole[]): NavItem[] {
  const items: NavItem[] = [];
  for (const item of NAV_ITEMS) {
    if (!hasAnyRole(roles, item.roles)) continue;
    if (isNavGroup(item)) {
      const children = item.children.filter((child) =>
        hasAnyRole(roles, child.roles)
      );
      if (children.length === 0) continue;
      items.push({ ...item, children });
    } else {
      items.push(item);
    }
  }
  return items;
}

export function canAccessRoute(roles: AppRole[], pathname: string) {
  if (pathname.startsWith("/user/")) {
    return hasRole(roles, "user") || isAdmin(roles) || isSuperAdmin(roles);
  }
  if (pathname.startsWith("/admin/")) {
    return isAdmin(roles) || isSuperAdmin(roles);
  }
  if (pathname.startsWith("/super-admin/")) {
    return isSuperAdmin(roles);
  }
  return true;
}
