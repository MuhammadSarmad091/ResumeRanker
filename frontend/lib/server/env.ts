import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(16).default("dev-resume-ranker-secret-min-16"),
  MONGODB_URI: z.string().url().optional(),
  PYTHON_SERVICE_URL: z.string().url().default("http://127.0.0.1:5000"),
  PYTHON_RANK_PATH: z.string().default("/api/rank"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default("usd"),
  STRIPE_PRICE_BASIC_CENTS: z.coerce.number().int().positive().default(2900),
  STRIPE_PRICE_GROWTH_CENTS: z.coerce.number().int().positive().default(9900),
  SCREENING_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  RATE_LIMIT_AUTH_PER_MIN: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_SCREENING_PER_MIN: z.coerce.number().int().positive().default(20),
  ENFORCE_CSRF: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${msg}`);
}

export const env = parsed.data;
