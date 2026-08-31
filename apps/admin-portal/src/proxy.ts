import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { locales } from "@likaslens/shared";
import createMiddleware from "next-intl/middleware";

const publicRoutes = ["/login"];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass if Supabase is not configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return intlMiddleware(request);
  }

  let supabaseResponse = intlMiddleware(request);

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

  // Refresh the Supabase session — keeps cookies valid
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — continue with existing cookies
  }

  // Helper: check if a path matches a locale-prefixed route
  const matchesPath = (target: string): boolean => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2,3}\b/, "") || "/";
    return pathWithoutLocale === target || pathWithoutLocale === `${target}/`;
  };

  const isPublicRoute = publicRoutes.some((route) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2,3}\b/, "") || "/";
    return pathWithoutLocale === route || pathWithoutLocale === `${route}/`;
  });

  const userRole = user?.user_metadata?.role as string | undefined;
  const isAuthorizedAdmin = !!(user && userRole && ["analyst", "super_admin", "admin", "lgu"].includes(userRole));

  // If user is logged in with an authorized admin role and trying to access login, redirect to dashboard
  if (isAuthorizedAdmin) {
    if (isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locales[0]}/dashboard`;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // If user is NOT logged in or does not have admin permissions
  if (!isAuthorizedAdmin) {
    if (isPublicRoute || matchesPath("/")) {
      return supabaseResponse;
    }
    // Redirect to login
    const url = request.nextUrl.clone();
    url.pathname = `/${locales[0]}/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: ["/(en|fil|vi|id|ms|ta|th|km|my|lo)/:path*", "/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
