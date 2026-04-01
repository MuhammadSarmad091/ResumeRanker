import { Schema, model, models, type InferSchemaType } from "mongoose";

const candidateResultSchema = new Schema(
  {
    runId: { type: String, required: true, index: true },
    rank: { type: Number, required: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    fitScore: { type: Number, required: true },
    raw: { type: Schema.Types.Mixed, required: true },
    shortlisted: { type: Boolean, default: false },
    notes: { type: String, default: "", maxlength: 4000 },
  },
  { timestamps: true },
);

candidateResultSchema.index({ runId: 1, rank: 1 });

export type CandidateResultDoc = InferSchemaType<typeof candidateResultSchema> & { _id: string };
export const CandidateResultModel = models.CandidateResult || model("CandidateResult", candidateResultSchema);
