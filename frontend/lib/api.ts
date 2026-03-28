import type { UploadResponse } from "./types";

const DEFAULT_API = "http://127.0.0.1:8000";

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

export async function uploadResumeBundle(
  jobDescriptionPdf: File,
  resumePdfs: File[],
  apiBaseOverride?: string | null
): Promise<UploadResponse> {
  const base = resolveApiBase(apiBaseOverride);
  const form = new FormData();
  form.append("job_description", jobDescriptionPdf);
  for (const file of resumePdfs) {
    form.append("resumes", file);
  }

  const res = await fetch(`${base}/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      if (err?.detail) detail = String(err.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  return res.json() as Promise<UploadResponse>;
}
