"use client";

import React, { useState } from "react";
import styled from "styled-components";
import ArticleList from "@/components/pages/admin/articles/ArticleList";
import ArticleForm, { ArticleFormData } from "@/components/pages/admin/articles/ArticleForm";
import ArticlePreview from "@/components/pages/admin/articles/ArticlePreview";
import { BackButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { newErrorToast, newSuccessToast } from "@/components/_toasts/toastEmitter";
import { useTranslations } from "next-intl";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

export default function AdminNewsletterManagePage() {
  const t = useTranslations("admin.articles.toasts");
  const tPage = useTranslations("admin.articles.page");
  const tBreadcrumbs = useTranslations("admin.breadcrumbs");
  const [mode, setMode] = useState<"list" | "create" | "edit" | "preview">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; type: "newsletter" } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const onCreate = () => setMode("create");
  const onEdit = (id: string) => {
    setEditingId(id);
    setMode("edit");
  };
  const onView = (id: string) => {
    setPreview({ id, type: "newsletter" });
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
        const res = await fetch(`/api/admin/articles/${editingId}?full=true`);
        const data = await res.json();
        const toLocalInput = (iso?: string | null) => {
          if (!iso) return "";
          const d = new Date(iso);
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setInitial({
          type: "newsletter",
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
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        ...data,
        type: "newsletter",
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null
      })
    });
    if (res.ok) {
      newSuccessToast(t("created"));
      goList();
    } else {
      newErrorToast(t("createError"));
    }
  };

  const handleEdit = async (data: ArticleFormData) => {
    if (!editingId) return;
    const res = await fetch(`/api/admin/articles/${editingId}`, {
      method: "PATCH",
      headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        ...data,
        type: "newsletter",
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null
      })
    });
    if (res.ok) {
      newSuccessToast(t("updated"));
      goList();
    } else {
      newErrorToast(t("updateError"));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "DELETE",
      headers: await withCsrfHeaders()
    });
    if (res.ok) {
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
          { label: tBreadcrumbs("newsletter"), href: "/admin/newsletter" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && tPage("newsletter.title")}
          {mode === "create" && tPage("newsletter.createTitle")}
          {mode === "edit" && tPage("newsletter.editTitle")}
          {mode === "preview" && tPage("newsletter.previewTitle")}
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
          type="newsletter"
          refreshToken={refreshToken}
        />
      )}

      {mode === "create" && (
        <ArticleForm initial={{ type: "newsletter" }} onCancel={goList} onSubmit={handleCreate} />
      )}

      {mode === "edit" && initial && (
        <ArticleForm initial={initial} onCancel={goList} onSubmit={handleEdit} />
      )}

      {mode === "preview" && preview && <ArticlePreview type={preview.type} id={preview.id} />}
    </Container>
  );
}
