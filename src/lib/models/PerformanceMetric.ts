import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPerformanceMetric extends Document {
  _id: mongoose.Types.ObjectId;
  flagKey: string;
  variant: string;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  endpoint?: string;
  action: string;
  duration: number; // in milliseconds
  success: boolean;
  errorMessage?: string;
  metadata?: {
    requestSize?: number;
    responseSize?: number;
    httpStatus?: number;
    userAgent?: string;
    [key: string]: unknown;
  };
  timestamp: Date;
}

const PerformanceMetricSchema: Schema = new Schema({
  flagKey: { type: String, required: true, index: true },
  variant: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String },
  endpoint: { type: String },
  action: { type: String, required: true },
  duration: { type: Number, required: true },
  success: { type: Boolean, required: true },
  errorMessage: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for analytics queries
PerformanceMetricSchema.index({ flagKey: 1, variant: 1, timestamp: -1 });
PerformanceMetricSchema.index({ timestamp: -1 });
PerformanceMetricSchema.index({ action: 1, timestamp: -1 });

export default (mongoose.models.PerformanceMetric as Model<IPerformanceMetric>) ||
  mongoose.model<IPerformanceMetric>("PerformanceMetric", PerformanceMetricSchema);
