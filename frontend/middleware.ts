import { NextResponse, type NextRequest } from "next/server";
import { getRequiredRoles, appRoleToEnterpriseRole } from "@/lib/roleIntelligence";
import type { AppRole } from "@/types";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/403",
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
];
const AUTH_PATHS = ["/login", "/register", "/auth/login", "/auth/signup"];

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.length === 0) {
    return new TextEncoder().encode("moat-super-secret-jwt-key-change-me-in-prod-12345");
  }
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next({ request });
  }

  // Read custom JWT from cookie
  const token = request.cookies.get("custom_access_token")?.value;
  let authUser: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      authUser = payload;
    } catch (e) {
      // Invalid or expired token
      authUser = null;
    }
  }

  const isAuthenticated = !!authUser;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const role = (authUser.role as AppRole) ?? "Patent Analyst";
    const workspace = appRoleToEnterpriseRole(role);
    const workspaceRoutes: Record<string, string> = {
      ceo: "/dashboard/ceo",
      cto: "/dashboard/cto",
      cio: "/dashboard/cio",
      patent_counsel: "/dashboard/legal",
      research_lead: "/dashboard/research",
      product_manager: "/dashboard/product",
      analyst: "/dashboard/search",
      admin: "/dashboard/settings/users",
    };
    const redirectTo = workspaceRoutes[workspace] ?? "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Protect /dashboard/** and /ceo/** routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/ceo")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles.length > 0) {
      const userRole = (authUser.role as AppRole) ?? "Patent Analyst";
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/403", request.url));
      }
    }
  }

  // Protect all other non-public routes
  if (!isAuthenticated && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health).*)",
  ],
};
