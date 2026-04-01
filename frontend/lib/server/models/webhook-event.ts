import { Schema, model, models, type InferSchemaType } from "mongoose";

const webhookEventSchema = new Schema(
  {
    provider: { type: String, required: true, index: true },
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export type WebhookEventDoc = InferSchemaType<typeof webhookEventSchema> & { _id: string };
export const WebhookEventModel = models.WebhookEvent || model("WebhookEvent", webhookEventSchema);
