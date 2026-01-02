import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICarouselElement {
  id: string;
  type: "container" | "text" | "qr" | "image" | "spacer";
  props: {
    content?: string | null;
    variant?: "h1" | "h2" | "h3" | "body" | null;
    color?: string | null;
    align?: "left" | "center" | "right" | null;
    fontSize?: string | null;
    fontWeight?: string | null;
    direction?: "row" | "column" | null;
    gap?: number | null;
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | null;
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | null;
    flex?: number | null;
    padding?: string | null;
    value?: string | null;
    size?: number | null;
    url?: string | null;
    alt?: string | null;
    height?: string | null;
    width?: string | null;
    objectFit?: "contain" | "cover" | null;
    grow?: number | null;
    heightPx?: number | null;
    widthPx?: number | null;
  };
  children?: ICarouselElement[] | null;
}

export interface IHackathon extends Document {
  title: string;
  date: Date;
  endDate: Date;
  location?: string | null;
  intermission?: {
    organizerLogoUrl?: string | null;
    schedule: {
      startTime: string;
      endTime?: string | null;
      title: string;
    }[];
    carousel: {
      id: string;
      duration: number;
      root: ICarouselElement;
      label?: string | null;
    }[];
    sponsors: {
      name: string;
      logoUrl: string;
      tier: number; // 0: Platinum/Center/Big, 1: Gold, etc.
    }[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleItemSchema = new Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: false },
    title: { type: String, required: true }
  },
  { _id: false }
);

const CarouselSlideSchema = new Schema(
  {
    id: { type: String, required: true },
    duration: { type: Number, required: true },
    root: { type: Schema.Types.Mixed, required: true },
    label: { type: String }
  },
  { _id: false }
);

const SponsorSchema = new Schema(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    tier: { type: Number, required: true, default: 2 }
  },
  { _id: false }
);

const HackathonSchema: Schema<IHackathon> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: false, default: null },
    intermission: {
      organizerLogoUrl: { type: String, default: null },
      schedule: [ScheduleItemSchema],
      carousel: [CarouselSlideSchema],
      sponsors: [SponsorSchema]
    }
  },
  {
    timestamps: true
  }
);

// Force deletion of the model in development if it exists to ensure schema updates
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Hackathon;
}

export default (mongoose.models.Hackathon as Model<IHackathon>) ||
  mongoose.model<IHackathon>("Hackathon", HackathonSchema);
