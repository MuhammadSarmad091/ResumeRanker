import { Schema, model, models, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: { type: String, index: true },
    action: { type: String, required: true, index: true },
    detail: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & { _id: string };
export const AuditLogModel = models.AuditLog || model("AuditLog", auditLogSchema);
