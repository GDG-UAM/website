"use client";
import { api } from "@/lib/eden";

import React, { useState } from "react";
import styled from "styled-components";
import ArticleList from "@/components/pages/admin/articles/ArticleList";
import ArticleForm, { ArticleFormData } from "@/components/pages/admin/articles/ArticleForm";
import ArticlePreview from "@/components/pages/admin/articles/ArticlePreview";
import { BackButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { newErrorToast, newSuccessToast } from "@/components/_toasts/toastEmitter";
import { useTranslations } from "next-intl";
import { getCsrfToken } from "next-auth/react";

export default function AdminBlogManagePage() {
  const t = useTranslations("admin.articles.toasts");
  const tPage = useTranslations("admin.articles.page");
  const tBreadcrumbs = useTranslations("admin.breadcrumbs");
  const [mode, setMode] = useState<"list" | "create" | "edit" | "preview">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; type: "blog" } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const onCreate = () => setMode("create");
  const onEdit = (id: string) => {
    setEditingId(id);
    setMode("edit");
  };
  const onView = (id: string) => {
    setPreview({ id, type: "blog" });
    setMode("preview");
  };
  const goList = () => {
    setMode("list");
    setEditingId(null);
    setPreview(null);
    setRefreshToken((x) => x + 1);
  };

  const [initial, setInitial] = useState<Partial<ArticleFormData>>();

  React.useEffect(() => {
    if (mode === "edit" && editingId) {
      (async () => {
        const { data, error } = await api.admin.articles({ id: editingId }).get({
          query: { full: "true" }
        });
        if (error || !data) return;

        const toLocalInput = (iso?: string | null) => {
          if (!iso) return "";
          const d = new Date(iso);
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setInitial({
          type: "blog",
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          status: data.status,
          authors: data.authors,
          publishedAt: toLocalInput(data.publishedAt)
        });
      })();
    } else {
      setInitial(undefined);
    }
  }, [mode, editingId]);

  const handleCreate = async (data: ArticleFormData) => {
    const payload = {
      ...data,
      type: "blog" as const,
      publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : undefined
    };
    const token = await getCsrfToken();
    const headers = { "x-csrf-token": token || "" };
    const { error } = await api.admin.articles.post(payload, { headers });

    if (!error) {
      newSuccessToast(t("created"));
      goList();
    } else {
      newErrorToast(t("createError"));
    }
  };

  const handleEdit = async (data: ArticleFormData) => {
    if (!editingId) return;
    const payload = {
      ...data,
      type: "blog" as const,
      publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : undefined
    };
    const token = await getCsrfToken();
    const headers = { "x-csrf-token": token || "" };
    const { error } = await api.admin.articles({ id: editingId }).patch(payload, { headers });

    if (!error) {
      newSuccessToast(t("updated"));
      goList();
    } else {
      newErrorToast(t("updateError"));
    }
  };

  const handleDelete = async (id: string) => {
    const token = await getCsrfToken();
    const headers = { "x-csrf-token": token || "" };
    const { error } = await api.admin.articles({ id }).delete(null, { headers });
    if (!error) {
      newSuccessToast(t("deleted"));
      goList();
    } else {
      newErrorToast(t("deleteError"));
    }
  };

  const Container = styled.div`
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  `;

  const Header = styled.div`
    margin-bottom: 20px;
  `;

  const Title = styled.h1`
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  `;

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tBreadcrumbs("admin"), href: "/admin" },
          { label: tBreadcrumbs("blog"), href: "/admin/blog" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && tPage("blog.title")}
          {mode === "create" && tPage("blog.createTitle")}
          {mode === "edit" && tPage("blog.editTitle")}
          {mode === "preview" && tPage("blog.previewTitle")}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goList}>{tPage("backToList")}</BackButton>
        </div>
      )}

      {mode === "list" && (
        <ArticleList
          onCreate={onCreate}
          onEdit={onEdit}
          onView={(id) => onView(id)}
          onDelete={handleDelete}
          type="blog"
          refreshToken={refreshToken}
        />
      )}

      {mode === "create" && (
        <ArticleForm initial={{ type: "blog" }} onCancel={goList} onSubmit={handleCreate} />
      )}

      {mode === "edit" && initial && (
        <ArticleForm initial={initial} onCancel={goList} onSubmit={handleEdit} />
      )}

      {mode === "preview" && preview && <ArticlePreview type={preview.type} id={preview.id} />}
    </Container>
  );
}
