import mongoose, { Schema, Document, Model } from "mongoose";

// Definimos los posibles estados de un evento
export type EventStatus = "draft" | "published";
export type EventDateStatus = "upcoming" | "past";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string; // URL- friendly slug
  markdownContent: string;
  description: string;
  date: Date;
  location: string;
  image?: string;
  status: EventStatus;
  url?: string; // External link (e.g. Meetup, Google Meet)
  blogUrl?: string; // Blog post link
  // createdAt and updatedAt are automatically added by the timestamps option
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    // Full markdown content for the event
    markdownContent: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    image: { type: String },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },
    url: {
      type: String,
      // Default to the chapter page when no external URL is provided
      default:
        (process.env.NEXT_PUBLIC_COMMUNITY_URL as string | undefined) ??
        "https://gdg.community.dev/gdg-on-campus-autonomous-university-of-madrid-madrid-spain/"
    },
    // Optional link to a related blog post
    blogUrl: { type: String }
  },
  {
    // This option automatically adds the createdAt and updatedAt fields
    timestamps: true
  }
);

// Export the Event model
// If it already exists in mongoose.models, reuse it; if not, create it.
export default (mongoose.models.Event as Model<IEvent>) ||
  mongoose.model<IEvent>("Event", EventSchema);
