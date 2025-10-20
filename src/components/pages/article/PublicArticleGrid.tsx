"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { ArticleCard } from "@/components/cards/ArticleCard";
import styled from "styled-components";
import { LocalizedArticle } from "@/lib/controllers/articleController";
import { ArticleType } from "@/lib/models/Article";
import { useSession } from "next-auth/react";
import { GridViewButton, ListViewButton, SearchButton } from "@/components/Buttons";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { useTranslations } from "next-intl";

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ListContainer = styled.div`
  margin: 0 auto;
  padding: 0;
  max-width: 900px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PageWrapper = styled.div`
  padding: 40px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
`;

const HeaderGrid = styled.header`
  display: grid;
  grid-template-columns: 1fr minmax(320px, 640px) 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  > :first-child {
    justify-self: start;
  }
  > :nth-child(2) {
    justify-self: center; /* search always perfectly centered */
  }
  > :last-child {
    justify-self: end;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    > :nth-child(2) {
      grid-column: 1 / -1;
      order: 3;
      margin-top: 8px;
      justify-self: stretch;
      width: 100%;
    }
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  gap: 32px;
  margin-top: 32px;
`;

type ArticleStatus = "published" | "draft" | "url_only";
type ArticleWithStatus = LocalizedArticle & { status?: ArticleStatus };

export function PublicArticleGrid({ type }: { type: ArticleType }) {
  const { data: session } = useSession();
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const canSeeAll = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["articles-see-all-articles"]
  );
  const fetchOnType = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["articles-fetch-on-type"]
  );

  const [articles, setArticles] = useState<ArticleWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [viewLoaded, setViewLoaded] = useState(false);
  const [query, setQuery] = useState<string>("");
  const debounceRef = useRef<number | null>(null);

  const t = useTranslations(type);
  const searchButtonId = `article-search-btn-${type}`;

  useEffect(() => {
    try {
      const otherType = type === "blog" ? "newsletter" : "blog";
      const currentView = localStorage.getItem(`view.${type}`);
      const otherView = localStorage.getItem(`view.${otherType}`);
      if (currentView === "grid" || currentView === "list") setView(currentView);
      else if (otherView === "grid" || otherView === "list") setView(otherView);
      else setView("grid");
    } catch {
      setView("grid");
    } finally {
      setViewLoaded(true);
    }
  }, [type]);

  const saveView = (v: "grid" | "list") => {
    try {
      localStorage.setItem(`view.${type}`, v);
    } catch {}
    setView(v);
  };

  const loadArticles = useCallback(
    async (q?: string) => {
      try {
        setError(null);
        const base = canSeeAll ? `/api/admin/articles?type=${type}` : `/api/articles?type=${type}`;
        const url = q ? `${base}${base.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : base;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load articles");
        const data = await res.json();
        let list: unknown = Array.isArray(data)
          ? data
          : (data?.articles as unknown) || (data?.items as unknown) || [];
        if (!Array.isArray(list)) list = [];
        setArticles(list as ArticleWithStatus[]);
        // reflect query in URL without navigating
        try {
          if (typeof window !== "undefined") {
            const u = new URL(window.location.href);
            if (q) u.searchParams.set("q", q);
            else u.searchParams.delete("q");
            window.history.replaceState({}, "", u.toString());
          }
        } catch {}
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [canSeeAll, type]
  );

  // initial load (hydrate query from URL)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q") || "";
        if (q) {
          setQuery(q);
          // if fetchOnType is disabled, load immediately; otherwise the debounce effect will handle it
          if (!fetchOnType) {
            setLoading(true);
            loadArticles(q);
          }
        } else {
          setLoading(true);
          loadArticles();
        }
      } else {
        setLoading(true);
        loadArticles();
      }
    } catch {
      setLoading(true);
      loadArticles();
    }
  }, [fetchOnType, loadArticles]);

  // debounced search when fetchOnType is enabled
  useEffect(() => {
    if (!fetchOnType) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      loadArticles(query || undefined);
    }, 350) as unknown as number;
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, fetchOnType, loadArticles]);

  const sorted = useMemo(() => {
    // Newest first if dates exist
    return [...articles].sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    });
  }, [articles]);

  return (
    <PageWrapper data-view={viewLoaded ? view : undefined}>
      <HeaderGrid>
        <Title>{t("title")}</Title>

        <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
          <TextField
            fullWidth
            placeholder={t("searchArticles")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // prevent default form submission
                e.preventDefault();
                // if fetchOnType is disabled, simulate a click on the search button
                try {
                  const btn =
                    typeof document !== "undefined"
                      ? document.getElementById(searchButtonId)
                      : null;
                  if (btn && !fetchOnType) {
                    // trigger native click to allow the SearchButton to run its own animation/logic
                    (btn as HTMLButtonElement).click();
                  } else if (!fetchOnType) {
                    // fallback: call loadArticles directly
                    loadArticles(query || undefined);
                  }
                } catch {
                  if (!fetchOnType) loadArticles(query || undefined);
                }
              }
            }}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchButton
                    id={searchButtonId}
                    onClick={() => loadArticles(query || undefined)}
                    iconSize={16}
                    style={{ marginRight: -10 }}
                    showSpinner
                  />
                </InputAdornment>
              )
            }}
          />
        </div>

        <Controls>
          <GridViewButton
            onClick={() => saveView("grid")}
            disabled={view === "grid"}
            iconSize={20}
          />
          <ListViewButton
            onClick={() => saveView("list")}
            disabled={view === "list"}
            iconSize={20}
          />
        </Controls>
      </HeaderGrid>

      {/* Preserve previous articles while loading; only show skeletons when we have none */}
      {loading && viewLoaded && articles.length === 0 && view === "grid" && (
        <Grid>
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCard key={`skeleton-${i}`} skeleton />
          ))}
        </Grid>
      )}
      {loading && viewLoaded && articles.length === 0 && view === "list" && (
        <ListContainer>
          {Array.from({ length: 3 }).map((_, i) => (
            <ArticleCard key={`skeleton-${i}`} skeleton />
          ))}
        </ListContainer>
      )}

      {/* {error && <p style={{ color: "var(--google-error-red)" }}>Error: {error}</p>} */}
      {error && <p>{t("noArticlesToShow")}</p>}

      {!loading && !error && sorted.length === 0 && <p>{t("noArticlesToShow")}</p>}

      {!loading && !error && viewLoaded && (
        <>
          {view === "grid" ? (
            <Grid>
              {sorted.map((article) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  status={article.status}
                  type={type}
                />
              ))}
            </Grid>
          ) : (
            <ListContainer>
              {sorted.map((article) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  status={article.status}
                  type={type}
                />
              ))}
            </ListContainer>
          )}
        </>
      )}
    </PageWrapper>
  );
}
