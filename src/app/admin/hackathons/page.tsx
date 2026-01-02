"use client";

import { useState } from "react";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import styled from "styled-components";
import { BackButton } from "@/components/Buttons";
import { useTranslations } from "next-intl";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import { withCsrfHeaders } from "@/lib/security/csrfClient";
import HackathonList from "@/components/pages/admin/hackathons/HackathonList";
import {
  HackathonForm,
  HackathonFormData
} from "@/components/pages/admin/hackathons/HackathonForm";

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

export default function AdminHackathonsPage() {
  const t = useTranslations("admin.hackathons");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<HackathonFormData>>();

  const goList = () => {
    setMode("list");
    setSelectedId(null);
    setInitialData(undefined);
  };

  const onCreate = () => {
    setInitialData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      location: ""
    });
    setMode("create");
  };

  const onEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/hackathons/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInitialData({
        title: data.title,
        date: new Date(data.date).toISOString().split("T")[0],
        endDate: new Date(data.endDate).toISOString().split("T")[0],
        location: data.location
      });
      setSelectedId(id);
      setMode("edit");
    } catch {
      newErrorToast(t("toasts.loadError"));
    }
  };

  const handleSave = async (data: HackathonFormData) => {
    setSubmitting(true);
    try {
      const url =
        mode === "create" ? "/api/admin/hackathons" : `/api/admin/hackathons/${selectedId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error();

      newSuccessToast(mode === "create" ? t("toasts.created") : t("toasts.updated"));
      goList();
    } catch {
      newErrorToast(t("toasts.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Hackathons", href: "/admin/hackathons" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list"
            ? t("page.title")
            : mode === "create"
              ? t("page.createTitle")
              : t("page.editTitle")}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goList}>{t("form.backToList")}</BackButton>
        </div>
      )}

      {mode === "list" ? (
        <HackathonList onCreate={onCreate} onEdit={onEdit} />
      ) : (
        <HackathonForm
          initial={initialData}
          onCancel={goList}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}
    </Container>
  );
}
