import { Schema, model, models, type InferSchemaType } from "mongoose";

const screeningRunSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    roleTitle: { type: String, default: "Role" },
    resumeCount: { type: Number, required: true },
    topScore: { type: Number, required: true },
    source: { type: String, default: "python" },
  },
  { timestamps: true },
);

screeningRunSchema.index({ userId: 1, createdAt: -1 });

export type ScreeningRunDoc = InferSchemaType<typeof screeningRunSchema> & { _id: string };
export const ScreeningRunModel = models.ScreeningRun || model("ScreeningRun", screeningRunSchema);
