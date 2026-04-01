import type { UploadResponse } from "./types";

const DEFAULT_API = "";

function logClient(event: string, meta: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  console.info(`[screenings-client] ${event}`, meta);
}

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

function normalizeLocalBase(base: string): string {
  if (!base || typeof window === "undefined") return base;
  try {
    const target = new URL(base);
    const current = window.location;
    const sameProtocol = target.protocol === current.protocol;
    const targetPort = target.port || (target.protocol === "https:" ? "443" : "80");
    const currentPort = current.port || (current.protocol === "https:" ? "443" : "80");
    const samePort = targetPort === currentPort;
    if (sameProtocol && samePort && isLoopbackHost(target.hostname) && isLoopbackHost(current.hostname)) {
      return "";
    }
    return base;
  } catch {
    return base;
  }
}

type V1Envelope = {
  success: boolean;
  data?: {
    runId?: string | null;
    upstream?: {
      ranked_resumes?: UploadResponse["ranked_resumes"];
      job_title?: string;
      [key: string]: unknown;
    };
  };
  error?: {
    message?: string;
  } | null;
};

export function resolveApiBase(override?: string | null): string {
  const trimmed = override?.trim();
  if (trimmed) {
    return trimmed.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return DEFAULT_API;
}

/** @deprecated use resolveApiBase */
export function getApiBase(): string {
  return resolveApiBase();
}

export async function uploadResumeBundle(jobDescriptionPdf: File, resumePdfs: File[], apiBaseOverride?: string | null): Promise<UploadResponse> {
  const base = normalizeLocalBase(resolveApiBase(apiBaseOverride));
  const form = new FormData();
  form.append("job_description", jobDescriptionPdf);
  for (const file of resumePdfs) {
    form.append("resumes", file);
  }

  const isLocalNode = base === "" || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
  const target = isLocalNode ? `${base}/api/v1/screenings` : `${base}/upload`;

  logClient("request:start", {
    target,
    base,
    mode: isLocalNode ? "next-api" : "python-direct",
    jobDescription: {
      name: jobDescriptionPdf.name,
      size: jobDescriptionPdf.size,
      type: jobDescriptionPdf.type,
    },
    resumeCount: resumePdfs.length,
    resumes: resumePdfs.map((f) => ({ name: f.name, size: f.size, type: f.type })),
  });

  const res = await fetch(target, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  logClient("request:response", {
    target,
    status: res.status,
    ok: res.ok,
    statusText: res.statusText,
    requestId: res.headers.get("x-request-id") ?? null,
  });

  if (!res.ok) {
    let detail = res.statusText;
    let parsedError: {
      detail?: string;
      error?: { message?: string; code?: string };
      requestId?: string;
    } | null = null;
    try {
      const err = (await res.json()) as
        | {
            detail?: string;
            error?: { message?: string; code?: string };
            requestId?: string;
          }
        | undefined;
      parsedError = err ?? null;
      if (err?.error?.message) {
        const code = err.error.code ? `[${err.error.code}] ` : "";
        const rid = err.requestId ? ` (requestId: ${err.requestId})` : "";
        detail = `${code}${String(err.error.message)}${rid}`;
      } else if (err?.detail) detail = String(err.detail);
    } catch {
      /* ignore */
    }
    logClient("request:error", {
      target,
      status: res.status,
      statusText: res.statusText,
      detail,
      requestId: parsedError?.requestId ?? res.headers.get("x-request-id") ?? null,
      errorCode: parsedError?.error?.code ?? null,
      raw: parsedError,
    });

    throw new Error(detail || `Request failed (${res.status})`);
  }

  const payload = (await res.json()) as UploadResponse | V1Envelope;

  logClient("request:success", {
    target,
    isV1Envelope: typeof (payload as V1Envelope).success === "boolean",
  });

  if (typeof (payload as V1Envelope).success === "boolean") {
    const env = payload as V1Envelope;
    const upstream = env.data?.upstream ?? {};
    return {
      job_description: {
        title: String(upstream.job_title ?? "Untitled role"),
      },
      resumes: [],
      ranked_resumes: upstream.ranked_resumes ?? [],
      run_id: env.data?.runId ?? null,
    };
  }

  return payload as UploadResponse;
}
