"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { SaveButton, CancelButton } from "@/components/Buttons";
import { useTranslations } from "next-intl";
import routing from "@/i18n/routing";
import CustomMarkdownTextArea from "@/components/markdown/CustomMarkdownTextArea";
import RenderMarkdown from "@/components/markdown/RenderMarkdown";

const Form = styled.form`
  display: grid;
  gap: 12px;
  max-width: 900px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

import { TextField, MenuItem } from "@mui/material";

const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

const FlagImg = styled.img`
  border-radius: 9px;
  margin-right: 8px;
`;

const LocalePickerWrap = styled.div`
  margin: 30px auto 10px;
`;

const PreviewTitle = styled.div`
  font-weight: 700;
  margin-bottom: 8px;
`;

export type ArticleFormData = {
  type: "blog" | "newsletter";
  title: Record<string, string>; // locale -> title
  slug?: string;
  excerpt?: Record<string, string>;
  content: Record<string, string>;
  coverImage?: string;
  status?: "draft" | "published" | "url_only";
  authors?: string[];
  publishedAt?: string;
};

function ArticleForm({
  initial,
  onCancel,
  onSubmit
}: {
  initial?: Partial<ArticleFormData>;
  onCancel?: () => void;
  onSubmit: (data: ArticleFormData) => Promise<void> | void;
  submitting?: boolean;
}) {
  const t = useTranslations("admin.articles.form");
  const locales = routing.locales as unknown as string[];
  const defaultLocale = routing.defaultLocale as unknown as string;
  const [activeLocale, setActiveLocale] = useState<string>(
    (locales.includes(String(initial?.["activeLocale"]))
      ? (initial as unknown as { activeLocale?: string })?.activeLocale
      : undefined) || defaultLocale
  );

  // Normalize initial values into maps
  const initTitle: Record<string, string> = useMemo(() => {
    const t = initial?.title as unknown as Record<string, string> | string | undefined;
    if (!t) return { [defaultLocale]: "" };
    return typeof t === "string" ? { [activeLocale]: t } : t;
  }, [initial?.title, activeLocale, defaultLocale]);
  const initExcerpt: Record<string, string> = useMemo(() => {
    const v = initial?.excerpt as unknown as Record<string, string> | string | undefined;
    if (!v) return {};
    return typeof v === "string" ? { [activeLocale]: v } : v;
  }, [initial?.excerpt, activeLocale]);
  const initContent: Record<string, string> = useMemo(() => {
    const v = initial?.content as unknown as Record<string, string> | string | undefined;
    if (!v) return { [defaultLocale]: "" };
    return typeof v === "string" ? { [activeLocale]: v } : v;
  }, [initial?.content, activeLocale, defaultLocale]);

  const [data, setData] = useState<ArticleFormData>({
    type: (initial?.type as "blog" | "newsletter") || "blog",
    title: initTitle,
    slug: initial?.slug || "",
    excerpt: initExcerpt,
    content: initContent,
    coverImage: initial?.coverImage || "",
    status: (initial?.status as ArticleFormData["status"]) || "draft",
    authors: (initial as Partial<ArticleFormData> & { authors?: string[] })?.authors || [],
    publishedAt: initial?.publishedAt || ""
  });

  const getFlagUrl = (code: string) =>
    `https://hatscripts.github.io/circle-flags/flags/language/${code}.svg`;

  const setMapField = (key: "title" | "excerpt" | "content", locale: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [locale]: value }
    }));
  };

  return (
    <Form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(data);
      }}
    >
      {data.type === "blog" ? (
        <>
          <TwoCol>
            <TextField
              select
              label={t("status")}
              value={data.status}
              onChange={(e) =>
                setData({ ...data, status: e.target.value as "draft" | "published" | "url_only" })
              }
            >
              <MenuItem value="draft">{t("statusOptions.draft")}</MenuItem>
              <MenuItem value="published">{t("statusOptions.published")}</MenuItem>
              <MenuItem value="url_only">{t("statusOptions.url_only")}</MenuItem>
            </TextField>
            <UserSelectShim
              value={data.authors || []}
              onChange={(ids) => setData({ ...data, authors: ids })}
              label={t("authors")}
              placeholder={t("authorsPlaceholder")}
            />
          </TwoCol>

          <TwoCol>
            <TextField
              label={t("coverImage")}
              value={data.coverImage}
              onChange={(e) => setData({ ...data, coverImage: e.target.value })}
            />
            <TextField
              label={t("publishDate")}
              type="datetime-local"
              value={data.publishedAt}
              onChange={(e) => setData({ ...data, publishedAt: e.target.value })}
            />
          </TwoCol>
        </>
      ) : (
        <>
          <TwoCol>
            <TextField
              select
              label={t("status")}
              value={data.status}
              onChange={(e) =>
                setData({ ...data, status: e.target.value as "draft" | "published" })
              }
            >
              <MenuItem value="draft">{t("statusOptions.draft")}</MenuItem>
              <MenuItem value="published">{t("statusOptions.published")}</MenuItem>
            </TextField>
            <TextField
              label={t("publishDate")}
              type="datetime-local"
              value={data.publishedAt}
              onChange={(e) => setData({ ...data, publishedAt: e.target.value })}
            />
          </TwoCol>

          <TextField
            label={t("coverImage")}
            value={data.coverImage}
            onChange={(e) => setData({ ...data, coverImage: e.target.value })}
          />
        </>
      )}

      {/* Locale selector */}
      <LocalePickerWrap>
        <TextField
          style={{ width: "100px" }}
          select
          label={t("locale") || "Language"}
          value={activeLocale}
          onChange={(e) => setActiveLocale(e.target.value)}
        >
          {locales.map((code) => (
            <MenuItem key={code} value={code}>
              <FlagImg src={getFlagUrl(code)} alt={code} width={18} height={18} />
              <span>{code.toUpperCase()}</span>
            </MenuItem>
          ))}
        </TextField>
      </LocalePickerWrap>

      <TwoCol>
        <TextField
          label={t("title")}
          value={data.title?.[activeLocale] || ""}
          onChange={(e) => setMapField("title", activeLocale, e.target.value)}
          required
        />
        <TextField
          label={t("slug")}
          value={data.slug}
          onChange={(e) => setData({ ...data, slug: e.target.value })}
          placeholder={t("slugPlaceholder")}
        />
      </TwoCol>

      <TextField
        label={t("excerpt")}
        value={data.excerpt?.[activeLocale] || ""}
        onChange={(e) => setMapField("excerpt", activeLocale, e.target.value)}
        multiline
        minRows={3}
      />

      <CustomMarkdownTextArea
        label={t("content")}
        value={data.content?.[activeLocale] || ""}
        onChange={(val) => setMapField("content", activeLocale, val)}
        minRows={12}
        placeholder={t("contentPlaceholder")}
      />

      {/* Preview */}
      <div>
        <PreviewTitle>{t("preview")}</PreviewTitle>
        <RenderMarkdown markdown={data.content?.[activeLocale] || ""} />
      </div>

      <Actions>
        <SaveButton onClick={() => onSubmit(data)}>{t("save")}</SaveButton>
        {onCancel && <CancelButton onClick={onCancel}>{t("cancel")}</CancelButton>}
      </Actions>
    </Form>
  );
}

export default ArticleForm;

// Lazy-load to avoid SSR issues with MUI Autocomplete in server components wrappers
const UserSelectShim = (props) => {
  const Comp = React.useMemo(
    () =>
      React.lazy(() =>
        import("@/components/forms/UserSelect").then((m) => ({ default: m.default }))
      ),
    []
  );
  return (
    <React.Suspense fallback={<div />}>
      <Comp {...props} />
    </React.Suspense>
  );
};
