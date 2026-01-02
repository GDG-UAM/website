import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRubricItem {
  name: string;
  maxScore: number;
  weight?: number;
}

export interface ITrack extends Document {
  name: string;
  hackathonId: mongoose.Types.ObjectId;
  judges: mongoose.Types.ObjectId[];
  rubrics: IRubricItem[];
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema: Schema<ITrack> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hackathonId: { type: Schema.Types.ObjectId, ref: "Hackathon", required: true },
    judges: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    rubrics: {
      type: [
        {
          name: { type: String, required: true },
          maxScore: { type: Number, required: true },
          weight: { type: Number, default: 1 }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default (mongoose.models.Track as Model<ITrack>) ||
  mongoose.model<ITrack>("Track", TrackSchema);
