import { z } from "zod";
import { assertCsrf } from "@/lib/server/csrf";
import { requireSessionUser } from "@/lib/server/authz";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { createPaymentIntentForTier } from "@/lib/server/services/billing-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  tier: z.enum(["basic", "growth", "enterprise"]),
});

export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    await assertCsrf(request);
    const user = await requireSessionUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new Error("Invalid billing payload");
    }
    const payment = await createPaymentIntentForTier({ userId: user.id, tier: parsed.data.tier });
    return ok(payment, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
