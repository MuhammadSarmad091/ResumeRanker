import { NextResponse } from "next/server";
import { z } from "zod";
import { signRefreshToken, signSessionToken } from "@/lib/jwt";
import { attachRefreshCookie, attachSessionCookie } from "@/lib/session-cookie";
import { env } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { fail, ok, requestIdFromHeaders, requireJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { createUserDb, persistRefreshSession } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  selectedTier: z.enum(["basic", "growth", "enterprise"]).optional(),
});

export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    assertRateLimit(`signup:${request.headers.get("x-forwarded-for") ?? "local"}`, env.RATE_LIMIT_AUTH_PER_MIN, 60_000);
    requireJson(request);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("AUTH_VALIDATION_FAILED", "Check email, password (8+ chars), and name.", 400, false);
    }
    const user = await createUserDb(parsed.data);
    const sessionPayload = { sub: user.id, email: user.email, name: user.name };
    const access = await signSessionToken(sessionPayload);
    const refresh = await signRefreshToken(sessionPayload);
    await persistRefreshSession(user.id, refresh);

    const res = NextResponse.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } }, error: null, requestId }, { status: 201 });
    attachSessionCookie(res, access);
    attachRefreshCookie(res, refresh);
    return res;
  } catch (err) {
    return fail(err, requestId);
  }
}
