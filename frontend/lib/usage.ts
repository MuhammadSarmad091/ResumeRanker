import type { SubscriptionTier } from "./plans";
import { monthlyResumeLimit } from "./plans";

type UsageRecord = { monthKey: string; count: number };

function key(userId: string) {
  return `rr_usage_${userId}`;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthlyResumeUsage(userId: string): {
  monthKey: string;
  count: number;
} {
  if (typeof window === "undefined") {
    return { monthKey: currentMonthKey(), count: 0 };
  }
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { monthKey: currentMonthKey(), count: 0 };
    const rec = JSON.parse(raw) as UsageRecord;
    const mk = currentMonthKey();
    if (rec.monthKey !== mk) return { monthKey: mk, count: 0 };
    return { monthKey: mk, count: rec.count };
  } catch {
    return { monthKey: currentMonthKey(), count: 0 };
  }
}

export function addMonthlyResumeUsage(userId: string, delta: number): void {
  if (typeof window === "undefined" || delta <= 0) return;
  const mk = currentMonthKey();
  const cur = getMonthlyResumeUsage(userId);
  const count = (cur.monthKey === mk ? cur.count : 0) + delta;
  localStorage.setItem(key(userId), JSON.stringify({ monthKey: mk, count }));
}

export function canProcessResumes(
  userId: string,
  tier: SubscriptionTier,
  resumeCount: number
): { ok: true } | { ok: false; limit: number; used: number } {
  const limit = monthlyResumeLimit(tier);
  if (limit === null) return { ok: true };
  const { count: used } = getMonthlyResumeUsage(userId);
  if (used + resumeCount <= limit) return { ok: true };
  return { ok: false, limit, used };
}
