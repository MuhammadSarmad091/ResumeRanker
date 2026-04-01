import { preferencesSchema } from "@/lib/prefs";
import { assertCsrf, getOrCreateCsrfToken } from "@/lib/server/csrf";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/authz";
import { patchPreferencesDb, readPreferencesDb } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

const patchSchema = preferencesSchema.partial();

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const prefs = await readPreferencesDb(user.id);
    await getOrCreateCsrfToken();
    return ok({ preferences: prefs }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}

export async function PATCH(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    await assertCsrf(request);
    const user = await requireSessionUser();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(new Error("Invalid preferences"), requestId);
    }
    const prefs = await patchPreferencesDb(user.id, parsed.data);
    return ok({ preferences: prefs }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
