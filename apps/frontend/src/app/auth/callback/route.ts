import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || "";

function safeUrl(base: string, path: string): string {
  const trimmed = base.trim();
  if (!trimmed) return path;
  let fullUrl: string;
  try {
    const parsed = new URL(trimmed);
    fullUrl = parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    fullUrl = `https://${trimmed.replace(/\/+$/, "")}`;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${fullUrl}${normalizedPath}`;
}

async function syncUserToLaravel(
  supabaseUserId: string,
  email: string,
  name?: string,
  role?: string,
) {
  try {
    const res = await fetch(safeUrl(LARAVEL_API, "/auth/sync"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        supabase_auth_user_id: supabaseUserId,
        email,
        name: name || email.split("@")[0],
        role: role || undefined,
      }),
    });
    if (res.ok) {
      const body = await res.json();
      return body?.data?.token as string | undefined;
    }
  } catch {
    // Laravel offline — auth still works
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect_to = searchParams.get("redirect_to") || "/dashboard";

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sync user to Laravel and get token
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const laravelToken = await syncUserToLaravel(
          user.id,
          user.email ?? "",
          user.user_metadata?.full_name as string | undefined,
          user.user_metadata?.role as string | undefined,
        );

        // Build redirect URL with locale prefix
        const redirectUrl = new URL(`${origin}/en${redirect_to}`);

        // Set laravel_token cookie on the response
        if (laravelToken) {
          const response = NextResponse.redirect(redirectUrl);
          response.cookies.set("laravel_token", laravelToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
          return response;
        }

        return NextResponse.redirect(redirectUrl);
      }
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
