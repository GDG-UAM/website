"use client";

import { useState } from "react";
import styled from "styled-components";
import { LinkList } from "@/app/admin/links/LinkList";
import { LinkForm, LinkFormData } from "@/app/admin/links/LinkForm";
import { BackButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import { withCsrfHeaders } from "@/lib/security/csrfClient";
import { useTranslations } from "next-intl";

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

/**
 * AdminLinksManagePage: Main page for managing short links in the admin panel.
 * It allows creating, editing, and listing links.
 */
export default function AdminLinksManagePage() {
  const t = useTranslations("admin.links");
  const tPage = useTranslations("admin.links.page");
  const tToasts = useTranslations("admin.links.toasts");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<LinkFormData>>();

  const goToList = () => {
    setMode("list");
    setEditingId(null);
    setInitialData(undefined);
    setRefreshToken((t) => t + 1);
  };

  const handleCreate = () => {
    setInitialData({});
    setMode("create");
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
    const res = await fetch(`/api/admin/links/${id}`);
    if (res.ok) {
      const data = await res.json();
      setInitialData(data);
      setMode("edit");
    } else {
      newErrorToast(tToasts("loadError"));
    }
  };

  const handleSubmit = async (data: LinkFormData) => {
    setSubmitting(true);
    const url = mode === "create" ? "/api/admin/links" : `/api/admin/links/${editingId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data)
      });

      if (res.ok) {
        newSuccessToast(mode === "create" ? tToasts("created") : tToasts("updated"));
        goToList();
      } else {
        const errorData = await res.json();
        newErrorToast(
          errorData.error || (mode === "create" ? tToasts("createError") : tToasts("updateError"))
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      newErrorToast(mode === "create" ? tToasts("createError") : tToasts("updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Links", href: "/admin/links" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && tPage("title")}
          {mode === "create" && tPage("createTitle")}
          {mode === "edit" && tPage("editTitle")}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goToList}>{t("form.backToList")}</BackButton>
        </div>
      )}

      {mode === "list" && (
        <LinkList onCreate={handleCreate} onEdit={handleEdit} refreshToken={refreshToken} />
      )}

      {(mode === "create" || mode === "edit") && (
        <LinkForm
          initial={initialData}
          onCancel={goToList}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </Container>
  );
}
