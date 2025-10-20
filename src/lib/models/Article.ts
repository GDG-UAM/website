import mongoose, { Schema, Document, Model } from "mongoose";

export type ArticleType = "blog" | "newsletter";
export type ArticleStatus = "draft" | "published" | "url_only";

export type LocalizedStringMap = Map<string, string>;

export interface IArticle extends Document {
  _id: mongoose.Types.ObjectId;
  type: ArticleType;
  title: LocalizedStringMap;
  slug: string;
  excerpt?: LocalizedStringMap;
  content: LocalizedStringMap;
  coverImage?: string;
  status: ArticleStatus;
  authors: mongoose.Types.ObjectId[];
  views: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema<IArticle> = new Schema(
  {
    type: { type: String, enum: ["blog", "newsletter"], required: true, index: true },
    title: { type: Map, of: String, required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    excerpt: { type: Map, of: String, default: {} },
    content: { type: Map, of: String, required: true },
    coverImage: { type: String },
    status: {
      type: String,
      enum: ["draft", "published", "url_only"],
      default: "draft",
      index: true
    },
    authors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Ensure slug uniqueness per type
ArticleSchema.index({ type: 1, slug: 1 }, { unique: true });
// Single text index for search across fields (index all keys within maps)
ArticleSchema.index({ "title.$**": "text", "excerpt.$**": "text", "content.$**": "text" });

export default (mongoose.models.Article as Model<IArticle>) ||
  mongoose.model<IArticle>("Article", ArticleSchema);
// both for blog and for the newsletter - the model should have a property to distinguish between the two
