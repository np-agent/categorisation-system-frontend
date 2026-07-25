import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/reset-password", "/verify-email"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function hasSessionFrontToken(request: NextRequest) {
  // SuperTokens sets sFrontToken when a session exists (including header auth mode).
  return Boolean(request.cookies.get("sFrontToken")?.value);
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = hasSessionFrontToken(request);
  const isPublic = isPublicPath(pathname);
  const isPasswordResetWithToken =
    pathname.startsWith("/reset-password") && searchParams.has("token");
  const isEmailVerifyWithToken =
    pathname.startsWith("/verify-email") && searchParams.has("token");

  if (!isAuthenticated && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    isPublic &&
    !isPasswordResetWithToken &&
    !isEmailVerifyWithToken &&
    pathname !== "/verify-email"
  ) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/home";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  if (pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = isAuthenticated ? "/home" : "/login";
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
