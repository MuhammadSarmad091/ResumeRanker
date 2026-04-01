import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { processStripeWebhook } from "@/lib/server/services/billing-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();
    const result = await processStripeWebhook(body, signature);
    return ok(result, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
