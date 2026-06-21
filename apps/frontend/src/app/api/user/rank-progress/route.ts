import { laravelAuthProxy } from "@/utils/laravel-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return laravelAuthProxy("/user/rank-progress");
}
