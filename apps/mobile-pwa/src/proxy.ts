import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { locales } from "@likaslens/shared";

const publicRoutes = ["/login", "/register", "/onboarding", "/splash"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a public route (exact segment match, not substring)
  const isPublicRoute = publicRoutes.some((route) => {
    const segments = pathname.split("/");
    return segments.includes(route.replace("/", ""));
  });
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = locales.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  ) || locales[0];

  // If user is logged in
  if (user) {
    // If they are trying to access a public route (login, register, onboarding) or the root page, redirect to dashboard
    if (isPublicRoute || pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // If user is NOT logged in
  if (!user) {
    // If they are on a public route or root page, allow them (root page has client logic to redirect to onboarding)
    if (isPublicRoute || pathname === "/") {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|api/).*)",
  ],
};
