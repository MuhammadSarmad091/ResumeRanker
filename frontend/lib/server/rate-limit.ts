import { AppError } from "./errors";

type WindowState = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, WindowState>();

export function assertRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { resetAt: now + windowMs, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    throw new AppError("AUTH_RATE_LIMITED", "Too many requests. Try again shortly.", 429, true);
  }
}
