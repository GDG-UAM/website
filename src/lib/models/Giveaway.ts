import mongoose, { Schema, model, Document } from "mongoose";

export interface IGiveaway extends Document {
  title: string;
  description?: string;
  mustBeLoggedIn: boolean;
  mustHaveJoinedEventId?: mongoose.Types.ObjectId | null;
  requirePhotoUsageConsent?: boolean;
  requireProfilePublic?: boolean;
  maxWinners: number;
  startAt?: Date | null;
  endAt?: Date | null;
  durationS?: number | null;
  remainingS?: number | null;
  winners?: mongoose.Types.ObjectId[];
  drawSeed?: string | null;
  drawInputHash?: string | null;
  drawInputSize?: number | null;
  drawAt?: Date | null;
  winnerProofs?: Array<{
    position: number;
    seed: string;
    entryId: mongoose.Types.ObjectId;
    at: Date;
    inputHash: string;
    inputSize: number;
  }>;
  deviceFingerprinting: boolean;
  status: "draft" | "active" | "paused" | "closed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const GiveawaySchema = new Schema<IGiveaway>(
  {
    title: { type: String, required: true },
    description: { type: String },
    mustBeLoggedIn: { type: Boolean, default: true },
    mustHaveJoinedEventId: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    requirePhotoUsageConsent: { type: Boolean, default: false },
    requireProfilePublic: { type: Boolean, default: false },
    maxWinners: { type: Number, default: 1 },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    durationS: { type: Number, default: null },
    remainingS: { type: Number, default: null },
    winners: [{ type: Schema.Types.ObjectId, ref: "GiveawayEntry", default: [] }],
    drawSeed: { type: String, default: null },
    drawInputHash: { type: String, default: null },
    drawInputSize: { type: Number, default: null },
    drawAt: { type: Date, default: null },
    winnerProofs: {
      type: [
        new Schema(
          {
            position: { type: Number, required: true },
            seed: { type: String, required: true },
            entryId: { type: Schema.Types.ObjectId, ref: "GiveawayEntry", required: true },
            at: { type: Date, required: true },
            inputHash: { type: String, required: true },
            inputSize: { type: Number, required: true }
          },
          { _id: false }
        )
      ],
      default: []
    },
    deviceFingerprinting: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "closed", "cancelled"],
      default: "draft"
    }
  },
  { timestamps: true }
);

// Index common queries
GiveawaySchema.index({ status: 1, startAt: 1, endAt: 1 });

export default (mongoose.models.Giveaway as mongoose.Model<IGiveaway>) ||
  model<IGiveaway>("Giveaway", GiveawaySchema);
