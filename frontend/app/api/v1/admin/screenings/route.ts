import { connectToDatabase } from "@/lib/server/db";
import { requireAdminUser } from "@/lib/server/authz";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { ScreeningRunModel } from "@/lib/server/models";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    await requireAdminUser();
    await connectToDatabase();
    if (!process.env.MONGODB_URI) return ok({ runs: [] }, requestId);
    const runs = await ScreeningRunModel.find({}).sort({ createdAt: -1 }).limit(200).lean();
    return ok({ runs }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
