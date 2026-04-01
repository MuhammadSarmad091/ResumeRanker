import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { preferencesSchema } from "@/lib/prefs";
import { patchPreferencesDb, readPreferencesDb } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

const patchSchema = preferencesSchema.partial();

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const prefs = await readPreferencesDb(session.sub);
  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  }

  try {
    const prefs = await patchPreferencesDb(session.sub, parsed.data);
    return NextResponse.json({ preferences: prefs });
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
