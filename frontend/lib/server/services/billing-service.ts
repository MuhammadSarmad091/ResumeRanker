import Stripe from "stripe";
import type { SubscriptionTier } from "@/lib/plans";
import { connectToDatabase } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { centsForTier } from "@/lib/server/plans";
import { PaymentRecordModel, SubscriptionModel, WebhookEventModel } from "@/lib/server/models";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("BILLING_PROVIDER_UNAVAILABLE", "Stripe is not configured", 503, false);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createPaymentIntentForTier(input: { userId: string; tier: SubscriptionTier }) {
  const amount = centsForTier(input.tier);
  if (!amount) {
    throw new AppError("BILLING_PLAN_INVALID", "Selected plan does not support card checkout", 400, false);
  }
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: env.STRIPE_CURRENCY,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: input.userId,
      targetTier: input.tier,
    },
  });

  await connectToDatabase();
  if (process.env.MONGODB_URI) {
    await PaymentRecordModel.updateOne(
      { stripePaymentIntentId: intent.id },
      {
        $set: {
          userId: input.userId,
          tier: input.tier,
          amount,
          currency: env.STRIPE_CURRENCY,
          status: intent.status,
        },
      },
      { upsert: true },
    );
    await SubscriptionModel.updateOne({ userId: input.userId }, { $set: { status: "pending", tier: input.tier, stripePaymentIntentId: intent.id } }, { upsert: true });
  }

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    amount,
    currency: env.STRIPE_CURRENCY,
  };
}

export async function getSubscriptionForUser(userId: string) {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return { tier: "basic", status: "none" };
  }
  const row = await SubscriptionModel.findOne({ userId }).lean();
  if (!row) return { tier: "basic", status: "none" };
  return { tier: row.tier, status: row.status };
}

export async function processStripeWebhook(rawBody: string, signature: string | null) {
  const stripe = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError("BILLING_PROVIDER_UNAVAILABLE", "Stripe webhook secret is missing", 503, false);
  }
  if (!signature) {
    throw new AppError("WEBHOOK_SIGNATURE_INVALID", "Missing stripe signature", 400, false);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError("WEBHOOK_SIGNATURE_INVALID", "Invalid stripe signature", 400, false);
  }

  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return { ok: true, eventId: event.id, skipped: true };
  }

  const existing = await WebhookEventModel.findOne({ provider: "stripe", eventId: event.id }).lean();
  if (existing) {
    return { ok: true, eventId: event.id, duplicate: true };
  }

  await WebhookEventModel.create({
    provider: "stripe",
    eventId: event.id,
    type: event.type,
    payload: event,
  });

  if (event.type === "payment_intent.succeeded") {
    const obj = event.data.object as Stripe.PaymentIntent;
    const userId = String(obj.metadata?.userId ?? "");
    const targetTier = String(obj.metadata?.targetTier ?? "basic") as SubscriptionTier;
    if (userId) {
      await PaymentRecordModel.updateOne({ stripePaymentIntentId: obj.id }, { $set: { status: obj.status } }, { upsert: true });
      await SubscriptionModel.updateOne(
        { userId },
        {
          $set: {
            status: "active",
            tier: targetTier,
            stripePaymentIntentId: obj.id,
          },
        },
        { upsert: true },
      );
    }
  }

  return { ok: true, eventId: event.id };
}
