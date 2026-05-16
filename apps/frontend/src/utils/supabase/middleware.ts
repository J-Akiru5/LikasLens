import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  return { response: NextResponse.next({ request }), user: null };
}
