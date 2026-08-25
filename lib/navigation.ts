import type { AppRole } from "@/lib/roles";
import { hasAnyRole, hasRole, isAdmin, isSuperAdmin } from "@/lib/roles";

export const ROLE_DEFAULT_ROUTES: Record<AppRole, string> = {
  user: "/user/jobs",
  admin: "/user/jobs",
  "super-admin": "/super-admin/templates",
};

export type NavItem = {
  label: string;
  href: string;
  roles: AppRole[];
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Create New Job",
    href: "/user/create-job",
    roles: ["user", "admin", "super-admin"],
    icon: "plus-circle",
  },
  {
    label: "View Jobs",
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
    label: "SelfBrief Team",
    href: "/super-admin/team",
    roles: ["super-admin"],
    icon: "shield",
  },
];

export function getDefaultRouteForRoles(roles: AppRole[]) {
  if (isSuperAdmin(roles)) return ROLE_DEFAULT_ROUTES["super-admin"];
  if (isAdmin(roles)) return ROLE_DEFAULT_ROUTES.admin;
  if (hasRole(roles, "user")) return ROLE_DEFAULT_ROUTES.user;
  return "/user/jobs";
}

export function getNavItemsForRoles(roles: AppRole[]) {
  return NAV_ITEMS.filter((item) => hasAnyRole(roles, item.roles));
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
