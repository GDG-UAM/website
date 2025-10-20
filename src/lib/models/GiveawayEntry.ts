import mongoose, { Schema, model, Document } from "mongoose";

export interface IGiveawayEntry extends Document {
  giveawayId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  anonId?: string | null;
  deviceFingerprint?: string | null;
  disqualified?: boolean;
  createdAt: Date;
}

const GiveawayEntrySchema = new Schema<IGiveawayEntry>(
  {
    giveawayId: { type: Schema.Types.ObjectId, ref: "Giveaway", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    anonId: { type: String, default: null, index: true },
    deviceFingerprint: { type: String, default: null },
    disqualified: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for common queries
GiveawayEntrySchema.index({ giveawayId: 1, userId: 1 });
GiveawayEntrySchema.index({ giveawayId: 1, anonId: 1 });
GiveawayEntrySchema.index({ giveawayId: 1, createdAt: 1 });

export default (mongoose.models.GiveawayEntry as mongoose.Model<IGiveawayEntry>) ||
  model<IGiveawayEntry>("GiveawayEntry", GiveawayEntrySchema);
