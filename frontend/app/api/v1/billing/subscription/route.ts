import { requireSessionUser } from "@/lib/server/authz";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { getSubscriptionForUser } from "@/lib/server/services/billing-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const subscription = await getSubscriptionForUser(user.id);
    return ok({ subscription }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
