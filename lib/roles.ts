export type AppRole = "user" | "admin" | "super-admin";

export function hasRole(roles: AppRole[], role: AppRole) {
  return roles.includes(role);
}

export function hasAnyRole(roles: AppRole[], allowed: AppRole[]) {
  return allowed.some((role) => roles.includes(role));
}

export function isSuperAdmin(roles: AppRole[]) {
  return roles.includes("super-admin");
}

export function isAdmin(roles: AppRole[]) {
  return roles.includes("admin") || roles.includes("super-admin");
}
