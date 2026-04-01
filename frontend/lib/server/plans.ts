import type { SubscriptionTier } from "@/lib/plans";
import { env } from "./env";

export function centsForTier(tier: SubscriptionTier): number | null {
  if (tier === "basic") return env.STRIPE_PRICE_BASIC_CENTS;
  if (tier === "growth") return env.STRIPE_PRICE_GROWTH_CENTS;
  return null;
}
