"use client";

import { useEffect, useRef, useState } from "react";
import RenderMarkdown from "@/components/markdown/RenderMarkdown";
import UserMention from "@/components/markdown/components/UserMention";
import LocalTimeWithSettings from "@/components/LocalTimeWithSettings";
import styled, { keyframes } from "styled-components";
import { useSession } from "next-auth/react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ArticleType } from "@/lib/types/article";
import CoverImage from "@/components/CoverImage";
// import ReadingProgress from "./ReadingProgress";

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

type Article = {
  title: string;
  content: string;
  authors: (string | { toString(): string })[];
  publishedAt?: string | Date;
  coverImage?: string;
  coverImageBlurHash?: string;
  coverImageWidth?: number;
  coverImageHeight?: number;
};

export default function ArticlePage({ type }: { type: ArticleType }) {
  const { data: session } = useSession();
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const canSeeAll = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["articles-see-all-articles"]
  );
  const params = useParams();
  const router = useRouter();
  const t = useTranslations(type);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchArticle() {
      console.log("Fetching article...");
      setLoading(true);
      const slug = decodeURIComponent(params?.slug as string)
        .trim()
        .toLowerCase();
      if (!isValidSlug(slug)) {
        notFound();
      }
      try {
        const endpoint = canSeeAll
          ? `/api/admin/articles/${slug}?type=${type}`
          : `/api/articles/${slug}?type=${type}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (active) setArticle(data.article || data);
      } catch {
        notFound();
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchArticle();
    return () => {
      active = false;
    };
  }, [params?.slug, canSeeAll, router, type]);

  if (loading) {
    return (
      <PageContainer>
        <SpinnerCenter>
          <Spinner />
        </SpinnerCenter>
      </PageContainer>
    );
  }
  if (!article) {
    notFound();
  }

  return (
    <PageContainer ref={pageRef}>
      {/* <ReadingProgress containerRef={articleRef} pageContainerRef={pageRef} /> */}
      <article>
        <Title>{article!.title}</Title>
        <Meta>
          {type === "blog" && article!.authors.length > 0 && (
            <p>
              {t("authors")}:{" "}
              {article!.authors.map((author: string, i: number) => (
                <span key={author.toString()}>
                  <UserMention userId={author.toString()} authorFormat />
                  {i < article!.authors.length - 1 ? ", " : null}
                </span>
              ))}
            </p>
          )}
          <p>
            {t.rich("publishedOn", {
              date: () =>
                article?.publishedAt ? (
                  <LocalTimeWithSettings
                    iso={new Date(article.publishedAt).toISOString()}
                    dateOnly={false}
                  />
                ) : (
                  ""
                )
            })}
          </p>
        </Meta>
        {article!.coverImage ? (
          <ImageWrap
            style={{
              aspectRatio:
                article.coverImageWidth && article.coverImageHeight
                  ? `${article.coverImageWidth} / ${article.coverImageHeight}`
                  : "16 / 9"
            }}
          >
            <CoverImage
              src={article!.coverImage}
              alt={article!.title}
              blurHash={article.coverImageBlurHash}
              width={article.coverImageWidth || 1200}
              height={article.coverImageHeight || 675}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                borderRadius: 12
              }}
            />
          </ImageWrap>
        ) : null}
        <div ref={articleRef}>
          <RenderMarkdown markdown={article!.content} />
        </div>
      </article>
    </PageContainer>
  );
}

const PageContainer = styled.section`
  padding: 40px 32px 80px;
  max-width: min(900px, calc(100vw - 76px));
  width: 100%;
  margin: 0 auto;
  position: relative;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  height: 100%;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 6px solid var(--loading-border);
  border-top: 6px solid var(--loading-border-top);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 8px;
`;

const Meta = styled.div`
  color: #6b7280;
  margin-bottom: 16px;
`;

const ImageWrap = styled.div`
  display: flex;
  width: 100%;
  max-height: 360px;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
`;
