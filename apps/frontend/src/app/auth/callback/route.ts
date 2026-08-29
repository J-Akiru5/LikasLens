import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirectTo = searchParams.get("redirect_to") || "/dashboard";
  // Strip any existing locale prefix (e.g. /en/dashboard → /dashboard) to avoid /en/en/dashboard
  const redirect_to = rawRedirectTo.replace(/^\/[a-z]{2,3}\b/, "") || "/dashboard";

  if (code) {
    // Create a redirect response first — we'll attach session cookies to it
    const redirectUrl = new URL(`${origin}/en${redirect_to}`);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Write cookies to both the request (for Supabase internal state)
            // and the response (so the browser actually receives them)
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL(
      `/en/login?error=${encodeURIComponent("Could not authenticate with Google. Please try again.")}`,
      origin,
    ),
  );
}
