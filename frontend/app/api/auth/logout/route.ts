import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE } from "@/lib/constants";
import { clearRefreshCookie, clearSessionCookie } from "@/lib/session-cookie";
import { getSession } from "@/lib/auth-server";
import { revokeRefreshSession } from "@/lib/server/services/user-service";

export async function POST() {
  const session = await getSession();
  if (session) {
    const jar = await cookies();
    const refresh = jar.get(REFRESH_COOKIE)?.value;
    await revokeRefreshSession(session.sub, refresh);
  }
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  clearRefreshCookie(res);
  return res;
}
