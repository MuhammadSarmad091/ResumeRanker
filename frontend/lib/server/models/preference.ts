import { Schema, model, models, type InferSchemaType } from "mongoose";

const preferenceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export type PreferenceDoc = InferSchemaType<typeof preferenceSchema> & { _id: string };
export const PreferenceModel = models.Preference || model("Preference", preferenceSchema);
