import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirectTo = searchParams.get("redirect_to") || "/dashboard";
  // Strip any existing locale prefix (e.g. /en/dashboard → /dashboard) to avoid /en/en/dashboard
  const redirect_to = rawRedirectTo.replace(/^\/[a-z]{2,3}\b/, "") || "/dashboard";

  // Determine base origin (localhost in dev or forwarded host)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  const baseUrl = host ? `${protocol}://${host}` : request.nextUrl.origin;

  if (code) {
    // Create a redirect response first — we'll attach session cookies to it
    const redirectUrl = new URL(`${baseUrl}/en${redirect_to}`);
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

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
    } catch {
      // Supabase unreachable or threw — fall through to error redirect
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL(
      `${baseUrl}/en/login?error=${encodeURIComponent("Could not authenticate with Google. Please try again.")}`,
    ),
  );
}
