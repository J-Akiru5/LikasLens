import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const ANALYST_ROUTES = [
  "/dashboard",
  "/analytics",
  "/tickets",
  "/ngos",
  "/laws",
];
const ADMIN_ONLY_ROUTES = [
  "/users",
  "/rewards",
  "/audit-logs",
  "/settings",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isPublic = pathname === "/" || isLoginPage;

  if (isPublic) {
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.user_metadata?.role as string | undefined;

  if (!role || role === "citizen" || role === "ghost") {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  const isAdminOnly = ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r));
  if (isAdminOnly && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/analytics/:path*", "/tickets/:path*", "/users/:path*", "/ngos/:path*", "/laws/:path*", "/rewards/:path*", "/audit-logs/:path*", "/settings/:path*"],
};
