import { locales, defaultLocale } from "@likaslens/shared";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

const ADMIN_ONLY_ROUTES = ["/users", "/rewards", "/audit-logs", "/settings"];

export default async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);

  // If Supabase is not configured yet, skip auth checks and just do locale routing
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  // Store original cookies so we can restore them if Supabase token refresh fails
  const originalCookies = request.cookies.getAll();

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
    // Supabase unreachable or token refresh failed — restore original cookies
    originalCookies.forEach(({ name, value }) => {
      response.cookies.set(name, value);
    });
    return response;
  }
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2,3}\b/, "") || "/";
  const isLoginPage = pathWithoutLocale.startsWith("/login");
  const isPublic = pathWithoutLocale === "/" || isLoginPage;

  if (isPublic) {
    if (user && isLoginPage) {
      const role = user.user_metadata?.role as string | undefined;
      if (role === "analyst" || role === "super_admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Citizen/ghost users stay on login page — no redirect loop
    }
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.user_metadata?.role as string | undefined;
  if (!role || role === "citizen" || role === "ghost") {
    // Don't redirect to /login (causes loop) — show access denied on a static page
    const deniedUrl = new URL("/login?error=access_denied", request.url);
    return NextResponse.redirect(deniedUrl);
  }

  const isAdminOnly = ADMIN_ONLY_ROUTES.some((r) =>
    pathWithoutLocale.startsWith(r),
  );
  if (isAdminOnly && role !== "super_admin") {
    return NextResponse.redirect(
      new URL("/dashboard?error=forbidden", request.url),
    );
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|fil|vi|id|ms|ta|th)/:path*", "/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
