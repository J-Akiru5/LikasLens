import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ANALYST_ROUTES = ["/dashboard/analytics"];
const ALLOWED_ROLES = ["analyst", "super_admin"];

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

  if (!user) {
    const protectedPaths = ["/dashboard", "/report"];
    const needsAuth = protectedPaths.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (needsAuth) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      loginUrl.searchParams.set("error", "Please sign in to continue.");
      return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
  }

  const role = user.user_metadata?.role as string | undefined;
  const isAnalystRoute = ANALYST_ROUTES.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isAnalystRoute && (!role || !ALLOWED_ROLES.includes(role))) {
    const dashUrl = new URL("/dashboard", request.url);
    dashUrl.searchParams.set("error", "You do not have access to this section.");
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/report"],
};
