import { cookies } from "next/headers";
import { env } from "./env";
import { AppError } from "./errors";

const CSRF_COOKIE = "rr_csrf";

export async function getOrCreateCsrfToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomUUID();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function assertCsrf(request: Request): Promise<void> {
  if (!env.ENFORCE_CSRF) return;
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new AppError("AUTH_UNAUTHORIZED", "CSRF token invalid", 403, false);
  }
}
