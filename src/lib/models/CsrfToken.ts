import mongoose, { Schema } from "mongoose";
export interface ICsrfToken {
  token: string;
  uid: string; // user id or client fingerprint
  exp: Date; // absolute expiration
  createdAt?: Date;
}

const CsrfTokenSchema = new Schema<ICsrfToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    uid: { type: String, required: true, index: true },
    exp: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// TTL index on exp schedules automatic removal.
// NOTE: MongoDB TTL cleanup is not instantaneous; we still check exp at verify time.
CsrfTokenSchema.index({ exp: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.CsrfToken ||
  mongoose.model<ICsrfToken>("CsrfToken", CsrfTokenSchema);
