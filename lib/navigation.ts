import type { AppRole } from "@/lib/roles";
import { hasAnyRole, hasRole, isAdmin, isSuperAdmin } from "@/lib/roles";

export const ROLE_ROUTES: Record<AppRole, string> = {
  user: "/user",
  admin: "/admin",
  "super-admin": "/super-admin",
};

export type NavItem = {
  label: string;
  href: string;
  roles: AppRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", roles: ["user", "admin", "super-admin"] },
  { label: "User", href: "/user", roles: ["user"] },
  { label: "Admin", href: "/admin", roles: ["admin"] },
  { label: "Super Admin", href: "/super-admin", roles: ["super-admin"] },
];

export function getRouteForRole(role: AppRole) {
  return ROLE_ROUTES[role];
}

export function getDefaultRouteForRoles(roles: AppRole[]) {
  if (isSuperAdmin(roles)) return ROLE_ROUTES["super-admin"];
  if (isAdmin(roles)) return ROLE_ROUTES.admin;
  if (hasRole(roles, "user")) return ROLE_ROUTES.user;
  return "/home";
}

export function getNavItemsForRoles(roles: AppRole[]) {
  return NAV_ITEMS.filter((item) => {
    if (item.href === "/home") return true;
    if (item.href === "/admin") return isAdmin(roles);
    if (item.href === "/super-admin") return isSuperAdmin(roles);
    return hasAnyRole(roles, item.roles);
  });
}

export function canAccessRoute(roles: AppRole[], pathname: string) {
  if (pathname === "/home" || pathname.startsWith("/home/")) return true;
  if (pathname === "/user" || pathname.startsWith("/user/")) {
    return hasRole(roles, "user") || isAdmin(roles);
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return isAdmin(roles);
  }
  if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) {
    return isSuperAdmin(roles);
  }
  return true;
}
