import { requireSessionUser } from "@/lib/server/authz";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { getRunById } from "@/lib/server/services/screening-service";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const { runId } = await params;
    const data = await getRunById(user.id, runId);
    return ok(data, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
