export type AppErrorCode = "AUTH_UNAUTHORIZED" | "AUTH_FORBIDDEN" | "AUTH_INVALID_CREDENTIALS" | "AUTH_EMAIL_TAKEN" | "AUTH_VALIDATION_FAILED" | "AUTH_RATE_LIMITED" | "PREFERENCES_INVALID" | "SCREENING_VALIDATION_FAILED" | "SCREENING_LIMIT_EXCEEDED" | "PYTHON_UPSTREAM_ERROR" | "PYTHON_TIMEOUT" | "AI_PROVIDER_AUTH_ERROR" | "BILLING_PLAN_INVALID" | "BILLING_PROVIDER_UNAVAILABLE" | "WEBHOOK_SIGNATURE_INVALID" | "WEBHOOK_DUPLICATE_EVENT" | "NOT_FOUND" | "INTERNAL_ERROR";

export class AppError extends Error {
  code: AppErrorCode;
  status: number;
  retryable: boolean;

  constructor(code: AppErrorCode, message: string, status = 400, retryable = false) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError("INTERNAL_ERROR", err.message || "Internal server error", 500, false);
  }
  return new AppError("INTERNAL_ERROR", "Internal server error", 500, false);
}
