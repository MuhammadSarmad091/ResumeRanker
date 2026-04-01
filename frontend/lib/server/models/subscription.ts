import { Schema, model, models, type InferSchemaType } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["basic", "growth", "enterprise"], default: "basic" },
    status: {
      type: String,
      enum: ["none", "pending", "active", "past_due", "canceled"],
      default: "none",
      index: true,
    },
    stripeCustomerId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema> & { _id: string };
export const SubscriptionModel = models.Subscription || model("Subscription", subscriptionSchema);
