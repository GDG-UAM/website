import db from "@/lib/db";
import Article, {
  IArticle,
  ArticleStatus,
  ArticleType,
  LocalizedStringMap
} from "@/lib/models/Article";
import { toSlug } from "@/lib/utils";
import { generateBlurHash } from "@/lib/utils/blurhash";
import { processMarkdownSave, processMarkdownForEdit } from "@/lib/utils/markdownImages";
import routing from "@/i18n/routing";
import type { FilterQuery, SortOrder } from "mongoose";

export type ArticleInput = {
  type: ArticleType;
  title: LocalizedStringMap;
  slug: string;
  excerpt?: LocalizedStringMap;
  content: LocalizedStringMap;
  coverImage?: string;
  status: ArticleStatus;
  authors: string[];
  publishedAt?: Date | null;
};

export type SortTypes = "newest" | "oldest" | "views";

/**
 * Helper to get entries from either a Map or a plain object
 */
function getMapEntries(mapOrObj: LocalizedStringMap | Record<string, string>): [string, string][] {
  if (mapOrObj instanceof Map) {
    return Array.from(mapOrObj.entries());
  }
  // Plain object
  return Object.entries(mapOrObj);
}

/**
 * Helper to get a value from either a Map or a plain object
 */
function getMapValue(
  mapOrObj: LocalizedStringMap | Record<string, string> | undefined,
  key: string
): string | undefined {
  if (!mapOrObj) return undefined;
  if (mapOrObj instanceof Map) {
    return mapOrObj.get(key);
  }
  // Plain object
  return (mapOrObj as Record<string, string>)[key];
}

/**
 * Process a LocalizedStringMap to add BlurHash to embedded images in each locale
 */
async function processLocalizedContent(
  content: LocalizedStringMap | Record<string, string>
): Promise<Record<string, string>> {
  const processed: Record<string, string> = {};
  const entries = getMapEntries(content);

  await Promise.all(
    entries.map(async ([locale, text]) => {
      if (text) {
        processed[locale] = await processMarkdownSave(text);
      }
    })
  );

  return processed;
}

/**
 * Convert LocalizedStringMap content back to markdown syntax for editing
 */
function processLocalizedContentForEdit(
  content: LocalizedStringMap | Record<string, string>
): Record<string, string> {
  const processed: Record<string, string> = {};
  for (const [locale, text] of getMapEntries(content)) {
    if (text) {
      processed[locale] = processMarkdownForEdit(text);
    }
  }
  return processed;
}

export async function createArticle(input: ArticleInput): Promise<IArticle> {
  await db.connect();
  const titleMap = input.title || {};
  const sourceTitle =
    (routing.defaultLocale && titleMap[routing.defaultLocale as unknown as string]) ||
    Object.values(titleMap).find((v) => !!v) ||
    "";
  const slug = (input.slug && toSlug(input.slug)) || toSlug(sourceTitle);

  // Generate BlurHash and get dimensions if coverImage is provided
  let coverImageBlurHash: string | null = null;
  let coverImageWidth: number | undefined;
  let coverImageHeight: number | undefined;
  if (input.coverImage) {
    const blurResult = await generateBlurHash(input.coverImage);
    if (blurResult) {
      coverImageBlurHash = blurResult.blurHash;
      coverImageWidth = blurResult.width;
      coverImageHeight = blurResult.height;
    }
  }

  // Process content for each locale to add BlurHash to embedded images
  const processedContent = await processLocalizedContent(
    input.content as unknown as LocalizedStringMap
  );

  const article = await Article.create({
    ...input,
    content: processedContent,
    slug,
    status: input.status || "draft",
    coverImageBlurHash,
    coverImageWidth,
    coverImageHeight
  });
  return article;
}

export async function updateArticle(
  id: string,
  input: Partial<ArticleInput>
): Promise<IArticle | null> {
  await db.connect();
  const update: Partial<
    ArticleInput & {
      slug: string;
      coverImageBlurHash?: string | null;
      coverImageWidth?: number;
      coverImageHeight?: number;
    }
  > = {
    ...input
  };
  if (input.slug) update.slug = toSlug(input.slug);
  if (input.title && !input.slug) {
    const map = input.title;
    const source =
      (routing.defaultLocale && map[routing.defaultLocale as unknown as string]) ||
      Object.values(map).find((v) => !!v) ||
      "";
    update.slug = toSlug(source);
  }

  // Regenerate BlurHash and dimensions if coverImage changed
  if (input.coverImage !== undefined) {
    if (input.coverImage) {
      const blurResult = await generateBlurHash(input.coverImage);
      if (blurResult) {
        update.coverImageBlurHash = blurResult.blurHash;
        update.coverImageWidth = blurResult.width;
        update.coverImageHeight = blurResult.height;
      } else {
        update.coverImageBlurHash = null;
        update.coverImageWidth = undefined;
        update.coverImageHeight = undefined;
      }
    } else {
      update.coverImageBlurHash = null;
      update.coverImageWidth = undefined;
      update.coverImageHeight = undefined;
    }
  }

  // Process content for each locale to add BlurHash to embedded images
  if (input.content) {
    const processedContent = await processLocalizedContent(
      input.content as unknown as LocalizedStringMap
    );
    update.content = processedContent as unknown as LocalizedStringMap;
  }

  const article = await Article.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  return article;
}

export async function deleteArticle(id: string): Promise<boolean> {
  await db.connect();
  const res = await Article.findByIdAndDelete(id);
  return !!res;
}

export async function getArticleById(id: string, incrementView = false): Promise<IArticle | null> {
  await db.connect();
  const doc = await Article.findById(id);
  if (doc && incrementView) {
    await Article.updateOne({ _id: doc._id }, { $inc: { views: 1 } });
  }
  return doc;
}

/**
 * Get an article by its ID for editing (converts mdimg back to markdown syntax).
 */
export async function getArticleByIdForEdit(id: string): Promise<IArticle | null> {
  await db.connect();
  const doc = await Article.findById(id);
  if (!doc) return null;

  // Convert mdimg tags back to markdown syntax for editing in all locales
  const articleObj = doc.toObject();
  if (articleObj.content) {
    // After toObject(), content is a plain object, not a Map
    articleObj.content = processLocalizedContentForEdit(
      articleObj.content as unknown as Record<string, string>
    ) as unknown as LocalizedStringMap;
  }

  return articleObj as IArticle;
}

export async function getArticleBySlug(
  type: ArticleType | undefined | null,
  slug: string,
  incrementView = false
): Promise<IArticle | null> {
  await db.connect();
  const query = { slug };
  if (type) Object.assign(query, { type });
  const doc = await Article.findOne(query);
  if (doc && incrementView) {
    await Article.updateOne({ _id: doc._id }, { $inc: { views: 1 } });
  }
  return doc;
}

export async function listArticles(params: {
  type?: ArticleType;
  status?: ArticleStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: SortTypes;
  onlyPublished?: boolean;
  includeContentInSearch?: boolean;
}): Promise<{
  items: IArticle[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await db.connect();
  const {
    type,
    status,
    search,
    page = 1,
    pageSize = 10,
    sort = "newest",
    onlyPublished = false,
    includeContentInSearch = false
  } = params || {};

  const filter: FilterQuery<IArticle> = {};

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (onlyPublished) filter.publishedAt = { $lte: new Date() };

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const mapFieldMatches = (field: string): FilterQuery<IArticle> => ({
      $expr: {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $objectToArray: `$${field}` },
                as: "kv",
                cond: { $regexMatch: { input: "$$kv.v", regex: escaped, options: "i" } }
              }
            }
          },
          0
        ]
      }
    });

    const filters: FilterQuery<IArticle>[] = [mapFieldMatches("title"), mapFieldMatches("excerpt")];
    if (includeContentInSearch) {
      filters.push(mapFieldMatches("content"));
    }
    filter.$or = filters;
  }

  const sortMap: Record<SortTypes, Record<string, SortOrder>> = {
    newest: { publishedAt: -1 as SortOrder, createdAt: -1 as SortOrder },
    oldest: { publishedAt: 1 as SortOrder, createdAt: 1 as SortOrder },
    views: { views: -1 as SortOrder }
  };

  const total = await Article.countDocuments(filter);
  const items = await Article.find(filter)
    .sort(sortMap[sort])
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  return { items, total, page, pageSize };
}

export type LocalizedArticle = Omit<
  IArticle,
  "title" | "excerpt" | "content" | "_id" | "views" | "type" | "status" | "createdAt" | "updatedAt"
> & {
  title: string;
  excerpt?: string;
  content: string;
  _id?: string;
  views?: number;
  type?: ArticleType;
  status?: ArticleStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

function selectLocalizedField(
  map: LocalizedStringMap | Record<string, string>,
  locale: string
): string {
  return getMapValue(map, locale) || getMapValue(map, routing.defaultLocale) || "";
}

export function selectArticleLocale(
  article: IArticle,
  locale: string,
  trim: boolean = false
): LocalizedArticle {
  const localizedArticle = article.toObject ? article.toObject() : { ...article };
  localizedArticle.title = selectLocalizedField(article.title, locale);
  localizedArticle.excerpt = article.excerpt ? selectLocalizedField(article.excerpt, locale) : "";
  localizedArticle.content = selectLocalizedField(article.content, locale);
  if (trim) {
    delete localizedArticle._id;
    delete localizedArticle.__v;
    delete localizedArticle.views;
    delete localizedArticle.type;
    delete localizedArticle.status;
    delete localizedArticle.createdAt;
    delete localizedArticle.updatedAt;
  }
  return localizedArticle;
}
