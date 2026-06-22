import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { locales } from "@likaslens/shared";
import createMiddleware from "next-intl/middleware";

const publicRoutes = ["/login", "/register", "/onboarding", "/splash", "/install"];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a public route (uses exact path matching to avoid false positives)
  const isPublicRoute = publicRoutes.some((route) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2,3}\b/, "") || "/";
    return pathWithoutLocale === route || pathWithoutLocale === `${route}/`;
  });

  const locale =
    locales.find(
      (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
    ) || locales[0];

  // Completely bypass next-intl for the root path to prevent auto-routing to /en
  if (pathname === "/") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = intlMiddleware(request);

  // If Supabase is not configured yet, apply simple public-route logic only
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }
  
  // COMPLETELY EXEMPT the /install route from all auth redirections
  if (pathname.endsWith("/install")) {
    return supabaseResponse;
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
            supabaseResponse.cookies.set(name, value, options),
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
    return supabaseResponse;
  }

  // Helper: check if a path matches a locale-prefixed route
  const matchesPath = (target: string): boolean => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2,3}\b/, "") || "/";
    return pathWithoutLocale === target || pathWithoutLocale === `${target}/`;
  };

  // If user is logged in
  if (user) {
    // If they are trying to access a public route (login, register, onboarding) or the root page, redirect to dashboard
    const isRoot = matchesPath("/");
    if (isPublicRoute || isRoot) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // If user is NOT logged in
  if (!user) {
    // If they are on a public route or root page, allow them (root page has client logic to redirect to onboarding)
    const isRoot = matchesPath("/");
    if (isPublicRoute || isRoot) {
      return supabaseResponse;
    }
    // Otherwise, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/(en|fil|vi|id|ms|ta|th|km|my|lo)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
