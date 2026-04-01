import { Schema, model, models, type InferSchemaType } from "mongoose";

const paymentRecordSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    stripePaymentIntentId: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["basic", "growth", "enterprise"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export type PaymentRecordDoc = InferSchemaType<typeof paymentRecordSchema> & { _id: string };
export const PaymentRecordModel = models.PaymentRecord || model("PaymentRecord", paymentRecordSchema);
