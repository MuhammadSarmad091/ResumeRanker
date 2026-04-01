import type { SubscriptionTier } from "@/lib/plans";
import { monthlyResumeLimit } from "@/lib/plans";
import { env } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { connectToDatabase } from "@/lib/server/db";
import { CandidateResultModel, ScreeningRunModel, UsageLedgerModel } from "@/lib/server/models";

type ParsedResume = {
  name?: string;
  email?: string;
  fitScore?: number;
  [key: string]: unknown;
};

type PythonUploadResponse = {
  ranked_resumes?: ParsedResume[];
  resumes?: ParsedResume[];
  job_title?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
};

function logService(event: string, meta: Record<string, unknown>): void {
  console.info(`[screening-service] ${event}`, meta);
}

function classifyPythonUpstreamError(status: number, payload: PythonUploadResponse): AppError {
  const raw = String(payload?.message ?? "Python service request failed");
  const msg = raw.toLowerCase();
  const isProviderAuthIssue = msg.includes("api key was reported as leaked") || msg.includes("invalid api key") || msg.includes("api_key_invalid") || msg.includes("permission denied") || msg.includes("unauthenticated") || msg.includes("authentication");

  if (isProviderAuthIssue) {
    return new AppError("AI_PROVIDER_AUTH_ERROR", "Gemini API key is invalid or revoked. Update GEMINI_API_KEY in backend environment and restart the Flask server.", 503, false);
  }

  const clientStatus = status >= 400 && status < 500 ? 502 : 502;
  return new AppError("PYTHON_UPSTREAM_ERROR", raw, clientStatus, true);
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyUsage(userId: string, tier: SubscriptionTier): Promise<{ count: number; limit: number | null; monthKey: string }> {
  await connectToDatabase();
  const monthKey = currentMonthKey();
  if (!process.env.MONGODB_URI) {
    return { count: 0, limit: monthlyResumeLimit(tier), monthKey };
  }
  const row = await UsageLedgerModel.findOne({ userId, monthKey }).lean();
  return { count: row?.count ?? 0, limit: monthlyResumeLimit(tier), monthKey };
}

async function incrementUsage(userId: string, delta: number): Promise<void> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) return;
  const monthKey = currentMonthKey();
  await UsageLedgerModel.updateOne({ userId, monthKey }, { $inc: { count: delta }, $setOnInsert: { monthKey, userId } }, { upsert: true });
}

export async function submitScreening(input: { userId: string; tier: SubscriptionTier; form: FormData; requestId: string }): Promise<{ runId: string | null; payload: PythonUploadResponse }> {
  const startedAt = Date.now();
  const resumeEntries = input.form.getAll("resumes");
  const resumeCount = resumeEntries.length;
  const jdEntry = input.form.get("job_description");

  logService("submit:start", {
    requestId: input.requestId,
    userId: input.userId,
    tier: input.tier,
    resumeCount,
    resumes: resumeEntries.filter((r): r is File => r instanceof File).map((f) => ({ name: f.name, size: f.size, type: f.type })),
    jobDescriptionKind: typeof jdEntry === "string" ? "text" : jdEntry instanceof File ? "file" : "missing",
    jobDescriptionFile: jdEntry instanceof File ? { name: jdEntry.name, size: jdEntry.size, type: jdEntry.type } : null,
  });

  if (resumeCount === 0) {
    logService("submit:validation-failed", { requestId: input.requestId, reason: "no-resumes" });
    throw new AppError("SCREENING_VALIDATION_FAILED", "No resumes were provided", 400, false);
  }

  const usage = await getMonthlyUsage(input.userId, input.tier);
  logService("submit:usage", {
    requestId: input.requestId,
    monthKey: usage.monthKey,
    count: usage.count,
    limit: usage.limit,
    incomingResumes: resumeCount,
  });

  if (usage.limit !== null && usage.count + resumeCount > usage.limit) {
    logService("submit:limit-exceeded", {
      requestId: input.requestId,
      count: usage.count,
      incomingResumes: resumeCount,
      limit: usage.limit,
    });
    throw new AppError("SCREENING_LIMIT_EXCEEDED", `Monthly limit reached (${usage.count}/${usage.limit}).`, 403, false);
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), env.SCREENING_TIMEOUT_MS);
  const url = `${env.PYTHON_SERVICE_URL.replace(/\/$/, "")}${env.PYTHON_RANK_PATH}`;
  const outbound = new FormData();

  if (typeof jdEntry === "string") {
    logService("submit:jd-text", { requestId: input.requestId, textLength: jdEntry.length });
    outbound.append("job_description", jdEntry);
  } else if (jdEntry instanceof File) {
    logService("submit:jd-file-forward", {
      requestId: input.requestId,
      fileName: jdEntry.name,
      fileSize: jdEntry.size,
      fileType: jdEntry.type,
    });
    outbound.append("job_description", jdEntry, jdEntry.name || "job_description.pdf");
  } else {
    logService("submit:validation-failed", { requestId: input.requestId, reason: "job-description-missing" });
    throw new AppError("SCREENING_VALIDATION_FAILED", "Job description is required", 400, false);
  }

  const weightsEntry = input.form.get("weights");
  if (typeof weightsEntry === "string" && weightsEntry.trim()) {
    outbound.append("weights", weightsEntry);
  }

  for (const resume of resumeEntries) {
    if (resume instanceof File) {
      outbound.append("resumes", resume, resume.name);
    }
  }

  logService("submit:python-request", {
    requestId: input.requestId,
    url,
    timeoutMs: env.SCREENING_TIMEOUT_MS,
    resumeCount,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: outbound,
      headers: {
        "x-request-id": input.requestId,
      },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logService("submit:python-network-error", {
      requestId: input.requestId,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw new AppError("PYTHON_TIMEOUT", "Python service unavailable or timed out", 504, true);
  } finally {
    clearTimeout(t);
  }

  logService("submit:python-response", {
    requestId: input.requestId,
    status: res.status,
    ok: res.ok,
    statusText: res.statusText,
  });

  let payload: PythonUploadResponse;
  try {
    payload = (await res.json()) as PythonUploadResponse;
  } catch {
    logService("submit:python-invalid-json", {
      requestId: input.requestId,
      status: res.status,
    });
    throw new AppError("PYTHON_UPSTREAM_ERROR", "Python service returned invalid JSON", 502, true);
  }

  if (!res.ok) {
    logService("submit:python-upstream-error", {
      requestId: input.requestId,
      status: res.status,
      message: payload?.message ?? null,
      code: payload?.code ?? null,
      payloadKeys: Object.keys(payload ?? {}),
    });
    throw classifyPythonUpstreamError(res.status, payload);
  }

  logService("submit:python-success", {
    requestId: input.requestId,
    rankedCount: Array.isArray(payload.ranked_resumes) ? payload.ranked_resumes.length : Array.isArray(payload.resumes) ? payload.resumes.length : 0,
    jobTitle: payload.job_title ?? null,
  });

  await incrementUsage(input.userId, resumeCount);
  logService("submit:usage-incremented", { requestId: input.requestId, delta: resumeCount });

  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    logService("submit:success-no-db", {
      requestId: input.requestId,
      elapsedMs: Date.now() - startedAt,
    });
    return { runId: null, payload };
  }

  const ranked = (payload.ranked_resumes ?? payload.resumes ?? []) as ParsedResume[];
  const topScore = Math.round(Number(ranked[0]?.fitScore ?? 0));
  const run = await ScreeningRunModel.create({
    userId: input.userId,
    roleTitle: String(payload.job_title ?? "Role"),
    resumeCount,
    topScore,
    source: "python",
  });

  if (ranked.length > 0) {
    await CandidateResultModel.insertMany(
      ranked.map((c, idx) => ({
        runId: String(run._id),
        rank: idx + 1,
        name: String(c.name ?? ""),
        email: String(c.email ?? ""),
        fitScore: Number(c.fitScore ?? 0),
        raw: c,
        shortlisted: false,
        notes: "",
      })),
    );
  }

  logService("submit:success", {
    requestId: input.requestId,
    runId: String(run._id),
    candidateCount: ranked.length,
    elapsedMs: Date.now() - startedAt,
  });

  return { runId: String(run._id), payload };
}

export async function listRuns(userId: string, limit = 20) {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) return [];
  return ScreeningRunModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function getRunById(userId: string, runId: string) {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return { run: null, candidates: [] };
  }

  const run = await ScreeningRunModel.findOne({ _id: runId, userId }).lean();
  if (!run) {
    throw new AppError("NOT_FOUND", "Run not found", 404, false);
  }
  const candidates = await CandidateResultModel.find({ runId }).sort({ rank: 1 }).lean();
  return { run, candidates };
}

export async function patchCandidateForRun(input: { userId: string; runId: string; candidateId: string; shortlisted?: boolean; notes?: string }) {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return null;
  }

  const run = await ScreeningRunModel.findOne({ _id: input.runId, userId: input.userId }).lean();
  if (!run) {
    throw new AppError("NOT_FOUND", "Run not found", 404, false);
  }

  const patch: Record<string, unknown> = {};
  if (typeof input.shortlisted === "boolean") {
    patch.shortlisted = input.shortlisted;
  }
  if (typeof input.notes === "string") {
    patch.notes = input.notes.slice(0, 4000);
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError("SCREENING_VALIDATION_FAILED", "No candidate fields were provided", 400, false);
  }

  const updated = await CandidateResultModel.findOneAndUpdate({ _id: input.candidateId, runId: input.runId }, { $set: patch }, { new: true }).lean();

  if (!updated) {
    throw new AppError("NOT_FOUND", "Candidate not found", 404, false);
  }

  return updated;
}
