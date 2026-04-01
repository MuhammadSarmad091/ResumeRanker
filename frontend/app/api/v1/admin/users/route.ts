import { connectToDatabase } from "@/lib/server/db";
import { requireAdminUser } from "@/lib/server/authz";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { UserModel } from "@/lib/server/models";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    await requireAdminUser();
    await connectToDatabase();
    if (!process.env.MONGODB_URI) return ok({ users: [] }, requestId);
    const users = await UserModel.find({}, { email: 1, name: 1, role: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).lean();
    return ok({ users }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
