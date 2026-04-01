import { requireSessionUser } from "@/lib/server/authz";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { getEffectiveTierForUser } from "@/lib/server/services/user-service";
import { getMonthlyUsage } from "@/lib/server/services/screening-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const tier = await getEffectiveTierForUser(user.id);
    const usage = await getMonthlyUsage(user.id, tier);
    const remaining = usage.limit === null ? null : Math.max(0, usage.limit - usage.count);
    return ok({ ...usage, tier, remaining }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
