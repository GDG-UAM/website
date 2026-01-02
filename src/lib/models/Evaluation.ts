import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvaluation extends Document {
  trackId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  judgeId: mongoose.Types.ObjectId;
  scores: Record<string, number>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema: Schema<IEvaluation> = new Schema(
  {
    trackId: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    judgeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scores: { type: Map, of: Number, default: {} },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

// Ensure a judge can only evaluate a team once per track
EvaluationSchema.index({ trackId: 1, teamId: 1, judgeId: 1 }, { unique: true });

export default (mongoose.models.Evaluation as Model<IEvaluation>) ||
  mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
