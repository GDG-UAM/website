import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeam extends Document {
  name: string;
  hackathonId: mongoose.Types.ObjectId;
  trackId?: mongoose.Types.ObjectId;
  password: string;
  projectDescription?: string;
  users: string[]; // List of user names or references
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hackathonId: { type: Schema.Types.ObjectId, ref: "Hackathon", required: true },
    trackId: { type: Schema.Types.ObjectId, ref: "Track" },
    password: { type: String, required: true },
    projectDescription: { type: String },
    users: { type: [String], default: [] }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure password uniqueness per hackathon
TeamSchema.index({ hackathonId: 1, password: 1 }, { unique: true });

export default (mongoose.models.Team as Model<ITeam>) || mongoose.model<ITeam>("Team", TeamSchema);
