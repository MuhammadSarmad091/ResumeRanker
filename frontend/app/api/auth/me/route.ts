import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { findUserById } from "@/lib/users-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const row = findUserById(session.sub);
  if (!row) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: { id: row.id, email: row.email, name: row.name },
  });
}
