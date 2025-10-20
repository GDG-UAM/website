import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeatureFlag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  key: string; // unique identifier for the flag
  description?: string;
  isActive: boolean;
  rolloutPercentage: number; // 0-100
  targetUsers: string[]; // specific user IDs who should get this flag
  excludeUsers: string[]; // specific user IDs who should NOT get this flag
  environment: "development" | "production";
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  metadata?: {
    experimentName?: string;
    variants?: string[];
    [key: string]: unknown;
  };
}

const FeatureFlagSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    rolloutPercentage: { type: Number, default: 0, min: 0, max: 100 },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    excludeUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    environment: {
      type: String,
      enum: ["development", "production"],
      default: "development"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

FeatureFlagSchema.index({ key: 1, environment: 1 }, { unique: true });
FeatureFlagSchema.index({ isActive: 1 });

export default (mongoose.models.FeatureFlag as Model<IFeatureFlag>) ||
  mongoose.model<IFeatureFlag>("FeatureFlag", FeatureFlagSchema);
