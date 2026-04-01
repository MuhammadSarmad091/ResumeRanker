import { Schema, model, models, type InferSchemaType } from "mongoose";

const usageLedgerSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
    count: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

usageLedgerSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

export type UsageLedgerDoc = InferSchemaType<typeof usageLedgerSchema> & { _id: string };
export const UsageLedgerModel = models.UsageLedger || model("UsageLedger", usageLedgerSchema);
