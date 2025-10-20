import mongoose, { Schema, Document, Model } from "mongoose";

interface ITelemetryEvent extends Document {
  _id: mongoose.Types.ObjectId;
  pseudoUserId?: string;
  sessionId?: string;
  anonId?: string;
  source: "client" | "server";
  eventType: string;
  ts: Date;
  domain?: string;
  path?: string;
  referrer?: string;
  locale?: Record<string, unknown>;
  environment?: Record<string, unknown>;
  api?: Record<string, unknown>;
  geo?: Record<string, unknown>;
  error?: Record<string, unknown>;
  eventProps?: Record<string, unknown>;
}

const TelemetryEventSchema: Schema = new Schema(
  {
    pseudoUserId: { type: String, index: true },
    sessionId: { type: String },
    anonId: { type: String },
    source: { type: String, enum: ["client", "server"], required: true },
    eventType: { type: String, required: true },
    ts: { type: Date, default: Date.now },
    domain: { type: String },
    path: { type: String },
    referrer: { type: String },
    locale: { type: Schema.Types.Mixed, default: {} },
    environment: { type: Schema.Types.Mixed, default: {} },
    api: { type: Schema.Types.Mixed, default: {} },
    geo: { type: Schema.Types.Mixed, default: {} },
    error: { type: Schema.Types.Mixed, default: {} },
    eventProps: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: false }
);

export default (mongoose.models.TelemetryEvent as Model<ITelemetryEvent>) ||
  mongoose.model<ITelemetryEvent>("TelemetryEvent", TelemetryEventSchema);
