import { z } from "zod";
import { requireSessionUser } from "@/lib/server/authz";
import { AppError } from "@/lib/server/errors";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { patchCandidateForRun } from "@/lib/server/services/screening-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  shortlisted: z.boolean().optional(),
  notes: z.string().max(4000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ runId: string; candidateId: string }> }) {
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const user = await requireSessionUser();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("SCREENING_VALIDATION_FAILED", "Invalid candidate patch", 400, false);
    }
    const { runId, candidateId } = await params;
    const candidate = await patchCandidateForRun({
      userId: user.id,
      runId,
      candidateId,
      ...parsed.data,
    });
    return ok({ candidate }, requestId);
  } catch (err) {
    return fail(err, requestId);
  }
}
