import { z } from "zod";

export const sectionWeightsSchema = z.object({
  skills: z.number().int().min(0).max(100),
  experience: z.number().int().min(0).max(100),
  education: z.number().int().min(0).max(100),
  projects: z.number().int().min(0).max(100),
  certifications: z.number().int().min(0).max(100),
});

export type SectionWeights = z.infer<typeof sectionWeightsSchema>;

export const preferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  apiBaseUrl: z.string().max(512),
  defaultMinScore: z.number().int().min(0).max(100),
  showFairnessPanel: z.boolean(),
  compactRankCards: z.boolean(),
  emailScreeningTips: z.boolean(),
  sectionWeights: sectionWeightsSchema,
  subscriptionTier: z.enum(["basic", "growth", "enterprise"]),
  analyticsAddOn: z.boolean(),
});

export type UserPreferences = z.infer<typeof preferencesSchema>;

export const defaultSectionWeights: SectionWeights = {
  skills: 32,
  experience: 28,
  education: 12,
  projects: 18,
  certifications: 10,
};

export const defaultPreferences: UserPreferences = {
  theme: "system",
  apiBaseUrl: "",
  defaultMinScore: 0,
  showFairnessPanel: true,
  compactRankCards: false,
  emailScreeningTips: true,
  sectionWeights: { ...defaultSectionWeights },
  subscriptionTier: "basic",
  analyticsAddOn: false,
};

export function normalizeSectionWeights(sw: SectionWeights): SectionWeights {
  const keys = [
    "skills",
    "experience",
    "education",
    "projects",
    "certifications",
  ] as const;
  const sum = keys.reduce((s, k) => s + Math.max(0, sw[k]), 0);
  if (sum <= 0) return { ...defaultSectionWeights };
  const out: SectionWeights = { ...sw };
  for (const k of keys) {
    out[k] = Math.round((Math.max(0, sw[k]) / sum) * 100);
  }
  const total = keys.reduce((s, k) => s + out[k], 0);
  if (total !== 100) {
    out.skills = Math.max(0, Math.min(100, out.skills + (100 - total)));
  }
  return out;
}

export function normalizePreferences(p: UserPreferences): UserPreferences {
  return {
    ...p,
    sectionWeights: normalizeSectionWeights(p.sectionWeights),
  };
}
