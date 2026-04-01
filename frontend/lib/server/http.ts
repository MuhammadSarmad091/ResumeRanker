import { NextResponse } from "next/server";
import { AppError, toAppError } from "./errors";

export function requestIdFromHeaders(headers: Headers): string {
  return headers.get("x-request-id") ?? crypto.randomUUID();
}

export function ok<T>(data: T, requestId: string, status = 200) {
  return NextResponse.json({ success: true, data, error: null, requestId }, { status });
}

export function fail(err: unknown, requestId: string) {
  const e = toAppError(err);
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: e.code,
        message: e.message,
        retryable: e.retryable,
      },
      requestId,
    },
    { status: e.status },
  );
}

export function requireJson(request: Request) {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new AppError("AUTH_VALIDATION_FAILED", "Content-Type must be application/json", 400, false);
  }
}
