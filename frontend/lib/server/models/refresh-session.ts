import { Schema, model, models, type InferSchemaType } from "mongoose";

const refreshSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type RefreshSessionDoc = InferSchemaType<typeof refreshSessionSchema> & { _id: string };
export const RefreshSessionModel = models.RefreshSession || model("RefreshSession", refreshSessionSchema);
