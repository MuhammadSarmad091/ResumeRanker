export type SubscriptionTier = "basic" | "growth" | "enterprise";

export type PlanDefinition = {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthly: string;
  resumeLimitPerMonth: number | null;
  highlights: string[];
  cta: string;
};

/** Demo pricing aligned with Lean Canvas tiers (volume-based). */
export const PLANS: PlanDefinition[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "SMEs & lean hiring teams",
    priceMonthly: "$29",
    resumeLimitPerMonth: 100,
    highlights: [
      "Up to 100 resume analyses / month",
      "Section-wise scoring & weights",
      "Shortlist, notes & CSV export",
      "Single workspace",
    ],
    cta: "Start Basic",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Agencies & growing teams",
    priceMonthly: "$99",
    resumeLimitPerMonth: 1_000,
    highlights: [
      "Up to 1,000 resume analyses / month",
      "Configurable weights per job family",
      "Usage dashboard & history",
      "Priority email support",
    ],
    cta: "Choose Growth",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "High volume & compliance",
    priceMonthly: "Custom",
    resumeLimitPerMonth: null,
    highlights: [
      "Unlimited analyses (fair use)",
      "Advanced analytics add-on ready",
      "Dedicated success & SLA options",
      "SSO / procurement-friendly",
    ],
    cta: "Contact sales",
  },
];

export function getPlan(tier: SubscriptionTier): PlanDefinition {
  return PLANS.find((p) => p.id === tier) ?? PLANS[0]!;
}

export function monthlyResumeLimit(tier: SubscriptionTier): number | null {
  return getPlan(tier).resumeLimitPerMonth;
}
