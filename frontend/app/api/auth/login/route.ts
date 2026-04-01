import { NextResponse } from "next/server";
import { z } from "zod";
import { signRefreshToken, signSessionToken } from "@/lib/jwt";
import { attachRefreshCookie, attachSessionCookie } from "@/lib/session-cookie";
import { assertPassword, persistRefreshSession } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  let user;
  try {
    user = await assertPassword(email, password);
  } catch {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  const refresh = await signRefreshToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  await persistRefreshSession(user.id, refresh);

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  attachSessionCookie(res, token);
  attachRefreshCookie(res, refresh);
  return res;
}
