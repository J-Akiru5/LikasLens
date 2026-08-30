import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { locales } from "@likaslens/shared";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export async function proxy(request: NextRequest) {
  // Bypass for API routes, static files, etc.
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

  // Refresh the Supabase session — this keeps cookies valid so
  // server components and client components both see the logged-in user.
  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase unreachable — continue with existing cookies
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
