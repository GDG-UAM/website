import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  image?: string;
  role: "user" | "team" | "admin";
  displayName?: string; // user-chosen public display name
  allowAnonUsage: boolean; // telemetry consent
  showProfilePublicly: boolean; // profile visibility
  experimentalOverrides: Record<string, boolean>; // per-flag user overrides
  profileHistory: Array<{ name: string; image?: string; changedAt: Date }>;
  downloadDataDisabledUntil?: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    role: { type: String, required: true, enum: ["user", "team", "admin"], default: "user" },
    displayName: { type: String },
    allowAnonUsage: { type: Boolean, default: true },
    showProfilePublicly: { type: Boolean, default: true },
    experimentalOverrides: { type: Object, default: {} },
    profileHistory: {
      type: [
        new Schema(
          {
            name: { type: String, required: true },
            image: { type: String },
            changedAt: { type: Date, required: true, default: Date.now }
          },
          { _id: false }
        )
      ],
      default: []
    },
    downloadDataDisabledUntil: { type: Date }
  },
  { timestamps: true }
);

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
