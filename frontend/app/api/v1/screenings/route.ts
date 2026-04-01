import { z } from "zod";
import { requireSessionUser } from "@/lib/server/authz";
import { env } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { fail, ok, requestIdFromHeaders } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { getEffectiveTierForUser } from "@/lib/server/services/user-service";
import { listRuns, submitScreening } from "@/lib/server/services/screening-service";

export const runtime = "nodejs";

function logRoute(event: string, meta: Record<string, unknown>): void {
  console.info(`[screenings-route] ${event}`, meta);
}

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  logRoute("post:start", {
    requestId,
    method: request.method,
    contentType: request.headers.get("content-type"),
    userAgent: request.headers.get("user-agent"),
  });
  try {
    const user = await requireSessionUser();
    logRoute("post:auth-ok", { requestId, userId: user.id });

    assertRateLimit(`screen:${user.id}`, env.RATE_LIMIT_SCREENING_PER_MIN, 60_000);
    logRoute("post:rate-limit-ok", { requestId, userId: user.id, perMin: env.RATE_LIMIT_SCREENING_PER_MIN });

    const form = await request.formData();
    const resumes = form.getAll("resumes");
    const jd = form.get("job_description");
    const weights = form.get("weights");
    logRoute("post:form-parsed", {
      requestId,
      resumeCount: resumes.length,
      resumeFiles: resumes.filter((v): v is File => v instanceof File).map((f) => ({ name: f.name, size: f.size, type: f.type })),
      jobDescriptionKind: typeof jd === "string" ? "text" : jd instanceof File ? "file" : "missing",
      jobDescriptionFile: jd instanceof File ? { name: jd.name, size: jd.size, type: jd.type } : null,
      hasWeights: typeof weights === "string" && weights.trim().length > 0,
    });

    const tier = await getEffectiveTierForUser(user.id);
    logRoute("post:tier", { requestId, userId: user.id, tier });

    const result = await submitScreening({
      userId: user.id,
      tier,
      form,
      requestId,
    });
    logRoute("post:success", {
      requestId,
      userId: user.id,
      tier,
      runId: result.runId,
      elapsedMs: Date.now() - startedAt,
      rankedCount: Array.isArray(result.payload?.ranked_resumes) ? result.payload.ranked_resumes.length : Array.isArray(result.payload?.resumes) ? result.payload.resumes.length : 0,
    });
    return ok({ runId: result.runId, tier, upstream: result.payload }, requestId, 201);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof AppError ? err.code : "UNHANDLED_ERROR";
    const status = err instanceof AppError ? err.status : 500;
    logRoute("post:error", {
      requestId,
      elapsedMs: Date.now() - startedAt,
      errorCode,
      status,
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return fail(err, requestId);
  }
}

export async function GET(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  logRoute("get:start", { requestId, url: request.url });
  try {
    const user = await requireSessionUser();
    logRoute("get:auth-ok", { requestId, userId: user.id });

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      throw new AppError("SCREENING_VALIDATION_FAILED", "Invalid query parameters", 400, false);
    }
    logRoute("get:query-ok", { requestId, limit: parsed.data.limit });

    const runs = await listRuns(user.id, parsed.data.limit);
    logRoute("get:success", { requestId, userId: user.id, count: runs.length, elapsedMs: Date.now() - startedAt });
    return ok({ runs }, requestId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof AppError ? err.code : "UNHANDLED_ERROR";
    const status = err instanceof AppError ? err.status : 500;
    logRoute("get:error", {
      requestId,
      elapsedMs: Date.now() - startedAt,
      errorCode,
      status,
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return fail(err, requestId);
  }
}
