import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/authz";
import { getEffectiveTierForUser } from "@/lib/server/services/user-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const subscriptionTier = await getEffectiveTierForUser(user.id);
    return ok(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        subscriptionTier,
      },
      requestId,
    );
  } catch (err) {
    return fail(err, requestId);
  }
}
