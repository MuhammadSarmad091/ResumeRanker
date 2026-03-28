import { NextResponse } from "next/server";
import { z } from "zod";
import { signSessionToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import { findUserByEmail } from "@/lib/users-store";
import { attachSessionCookie } from "@/lib/session-cookie";

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
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  attachSessionCookie(res, token);
  return res;
}
