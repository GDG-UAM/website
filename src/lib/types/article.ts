export type ArticleType = "blog" | "newsletter";
export type ArticleStatus = "draft" | "published" | "url_only";

export type LocalizedArticle = {
  title: string;
  excerpt?: string;
  content: string;
  slug: string;
  coverImage?: string;
  coverImageBlurHash?: string;
  coverImageWidth?: number;
  coverImageHeight?: number;
  authors: string[];
  publishedAt?: Date | null;
  _id?: string;
  views?: number;
  type?: ArticleType;
  status?: ArticleStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SortTypes = "newest" | "oldest" | "views";
