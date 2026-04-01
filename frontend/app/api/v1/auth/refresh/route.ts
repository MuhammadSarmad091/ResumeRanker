import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFRESH_COOKIE } from "@/lib/constants";
import { signRefreshToken, signSessionToken, verifyRefreshToken } from "@/lib/jwt";
import { attachRefreshCookie, attachSessionCookie, clearRefreshCookie, clearSessionCookie } from "@/lib/session-cookie";
import { AppError } from "@/lib/server/errors";
import { fail, requestIdFromHeaders } from "@/lib/server/http";
import { findUserByIdDb, rotateRefreshSession } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const jar = await cookies();
    const refresh = jar.get(REFRESH_COOKIE)?.value;
    if (!refresh) {
      throw new AppError("AUTH_UNAUTHORIZED", "Missing refresh session", 401, false);
    }
    const payload = await verifyRefreshToken(refresh);
    if (!payload) {
      throw new AppError("AUTH_UNAUTHORIZED", "Invalid refresh token", 401, false);
    }
    const user = await findUserByIdDb(payload.sub);
    if (!user) {
      throw new AppError("AUTH_UNAUTHORIZED", "Unknown user", 401, false);
    }

    const sessionPayload = { sub: user.id, email: user.email, name: user.name };
    const nextAccess = await signSessionToken(sessionPayload);
    const nextRefresh = await signRefreshToken(sessionPayload);
    const rotated = await rotateRefreshSession(user.id, refresh, nextRefresh);
    if (!rotated) {
      throw new AppError("AUTH_UNAUTHORIZED", "Refresh session is expired", 401, false);
    }

    const res = NextResponse.json({ success: true, data: { refreshed: true }, error: null, requestId });
    attachSessionCookie(res, nextAccess);
    attachRefreshCookie(res, nextRefresh);
    return res;
  } catch (err) {
    const res = fail(err, requestId);
    clearSessionCookie(res);
    clearRefreshCookie(res);
    return res;
  }
}
