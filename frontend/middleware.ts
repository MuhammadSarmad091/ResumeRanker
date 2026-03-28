import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";
import { getJwtSecretKey } from "@/lib/jwt";

const protectedPrefixes = ["/dashboard", "/rank", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("rr_session")?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jose.jwtVerify(token, getJwtSecretKey());
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete("rr_session");
    return res;
  }
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/rank", "/rank/:path*", "/settings", "/settings/:path*"],
};
