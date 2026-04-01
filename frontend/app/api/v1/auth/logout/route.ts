import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFRESH_COOKIE } from "@/lib/constants";
import { clearRefreshCookie, clearSessionCookie } from "@/lib/session-cookie";
import { requireSessionUser } from "@/lib/server/authz";
import { fail, requestIdFromHeaders } from "@/lib/server/http";
import { revokeRefreshSession } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const jar = await cookies();
    const refresh = jar.get(REFRESH_COOKIE)?.value;
    await revokeRefreshSession(user.id, refresh);
    const res = NextResponse.json({ success: true, data: { ok: true }, error: null, requestId });
    clearSessionCookie(res);
    clearRefreshCookie(res);
    return res;
  } catch (err) {
    return fail(err, requestId);
  }
}
