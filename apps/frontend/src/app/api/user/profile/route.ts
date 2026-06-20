import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || "";

export async function GET() {
  const token = (await cookies()).get("laravel_token")?.value;
  if (!token) {
    return Response.json({ success: false, message: "Unauthenticated." }, { status: 401 });
  }

  const res = await fetch(`${LARAVEL_API}/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return Response.json(
      body ?? { success: false, message: "Upstream error" },
      { status: res.status },
    );
  }

  return Response.json(body);
}
