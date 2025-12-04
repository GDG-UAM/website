"use client";
import { api } from "@/lib/eden";

import { useState } from "react";
import styled from "styled-components";
import { LinkList } from "@/app/admin/links/LinkList";
import { LinkForm, LinkFormData } from "@/app/admin/links/LinkForm";
import { BackButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import { useTranslations } from "next-intl";
import { getCsrfToken } from "@/lib/security/csrfClient";

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
    const { data, error } = await api.admin.links({ id }).get();
    if (!error && data) {
      setInitialData(data);
      setMode("edit");
    } else {
      newErrorToast(tToasts("loadError"));
    }
  };

  const handleSubmit = async (data: LinkFormData) => {
    setSubmitting(true);

    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };

      let error;
      if (mode === "create") {
        const res = await api.admin.links.post(data, { headers });
        error = res.error;
      } else {
        const res = await api.admin.links({ id: editingId! }).patch(data, { headers });
        error = res.error;
      }

      if (!error) {
        newSuccessToast(mode === "create" ? tToasts("created") : tToasts("updated"));
        goToList();
      } else {
        const errorMsg = typeof error === "string" ? error : error?.value?.error;
        newErrorToast(
          errorMsg || (mode === "create" ? tToasts("createError") : tToasts("updateError"))
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
