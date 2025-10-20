import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILink extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string; // The short URL path (e.g., "discord" for /link/discord)
  destination: string; // The full URL to redirect to
  title: string; // Human-readable title for the link
  description?: string; // Optional description
  isActive: boolean; // Whether the link is active or not
  clicks: number; // Track number of clicks
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema: Schema<ILink> = new Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/ // Only allow lowercase letters, numbers, and hyphens
    },
    destination: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Export the Link model
export default (mongoose.models.Link as Model<ILink>) || mongoose.model<ILink>("Link", LinkSchema);
