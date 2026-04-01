import { NextResponse } from "next/server";
import { z } from "zod";
import { signRefreshToken, signSessionToken } from "@/lib/jwt";
import { attachRefreshCookie, attachSessionCookie } from "@/lib/session-cookie";
import { AppError } from "@/lib/server/errors";
import { createUserDb, persistRefreshSession } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
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
    return NextResponse.json({ error: "Check email, password (8+ chars), and name." }, { status: 400 });
  }

  const { email, password, name } = parsed.data;

  try {
    const user = await createUserDb({ email, password, name });
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
  } catch (e) {
    if (e instanceof AppError && e.code === "AUTH_EMAIL_TAKEN") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
