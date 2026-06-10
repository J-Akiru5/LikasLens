import { locales, defaultLocale } from "@likaslens/shared";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

export default async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);

  // Multi-tenant: extract subdomain
  const host = request.headers.get("host") || "";
  let tenantSlug = null;
  if (!host.includes("localhost") && !/^(\d+\.){3}\d+/.test(host)) {
    const parts = host.split(".");
    if (parts.length >= 3 && parts[0] !== "www" && parts[0] !== "api") {
      tenantSlug = parts[0];
    }
  }

  if (tenantSlug) {
    response.headers.set("x-tenant-slug", tenantSlug);
    request.headers.set("x-tenant-slug", tenantSlug);
  }

  // If Supabase is not configured yet, skip auth checks and just do locale routing
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — treat as unauthenticated
    return response;
  }
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2,3}\b/, "") || "/";

  if (!user) {
    const protectedPaths = ["/dashboard", "/report"];
    const needsAuth = protectedPaths.some((p) =>
      pathWithoutLocale.startsWith(p),
    );
    if (needsAuth) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect_to", pathname);
      loginUrl.searchParams.set("error", "Please sign in to continue.");
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // --- Role-Based Access Control (RBAC) ---
  const userRole = (user.user_metadata?.role as string) || "citizen";

  // 1. Super Admin Only Routes
  const superAdminRoutes = [
    "/dashboard/users",
    "/dashboard/ngos",
    "/dashboard/rewards",
    "/dashboard/audit-logs",
  ];
  if (superAdminRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
    if (userRole !== "super_admin") {
      const redirectUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Analyst / Super Admin Routes
  const analystRoutes = ["/dashboard/analytics"];
  if (analystRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
    if (userRole !== "super_admin" && userRole !== "analyst") {
      const redirectUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
