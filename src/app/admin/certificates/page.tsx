"use client";

import { api } from "@/lib/eden";
import { useState, useEffect } from "react";
import styled from "styled-components";
import CertificateList from "@/components/pages/admin/certificates/CertificateList";
import CertificateForm, {
  CertificateFormData
} from "@/components/pages/admin/certificates/CertificateForm";
import Certificate from "@/components/Certificate";
import { BackButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { newErrorToast, newSuccessToast } from "@/components/_toasts/toastEmitter";
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

type Mode = "list" | "create" | "edit" | "preview";

export default function AdminCertificatesPage() {
  const t = useTranslations("admin.certificates.toasts");
  const tPage = useTranslations("admin.certificates.page");
  const tBreadcrumbs = useTranslations("admin.breadcrumbs");

  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [initial, setInitial] = useState<Partial<CertificateFormData>>();

  const onCreate = () => {
    setInitial(undefined);
    setMode("create");
  };

  const onEdit = (id: string) => {
    setEditingId(id);
    setMode("edit");
  };

  const onView = (id: string) => {
    setPreviewId(id);
    setMode("preview");
  };

  const onDuplicate = async (id: string) => {
    try {
      const { data, error } = await api.admin.certificates({ id }).get();
      if (error || !data) {
        newErrorToast(t("loadError"));
        return;
      }

      // Prepare duplicate data (remove identity fields)
      const duplicateData: Partial<CertificateFormData> = {
        type: data.type as CertificateFormData["type"],
        title: data.title,
        description: data.description || "",
        designId: data.designId,
        recipient: {
          name: data.recipient.name,
          userId: data.recipient.userId?.toString() || ""
        },
        period: data.period
          ? {
              startDate: data.period.startDate
                ? new Date(data.period.startDate).toISOString().split("T")[0]
                : "",
              endDate: data.period.endDate
                ? new Date(data.period.endDate).toISOString().split("T")[0]
                : ""
            }
          : undefined,
        signatures: data.signatures || [],
        metadata: data.metadata || {}
      };

      setInitial(duplicateData);
      setMode("create");
    } catch {
      newErrorToast(t("loadError"));
    }
  };

  const goList = () => {
    setMode("list");
    setEditingId(null);
    setPreviewId(null);
    setInitial(undefined);
    setRefreshToken((x) => x + 1);
  };

  // Load certificate data when editing
  useEffect(() => {
    if (mode === "edit" && editingId) {
      (async () => {
        try {
          const { data, error } = await api.admin.certificates({ id: editingId }).get();
          if (error || !data) {
            newErrorToast(t("loadError"));
            goList();
            return;
          }

          setInitial({
            type: data.type as CertificateFormData["type"],
            title: data.title,
            description: data.description || "",
            designId: data.designId,
            recipient: {
              name: data.recipient.name,
              userId: data.recipient.userId?.toString() || ""
            },
            period: data.period
              ? {
                  startDate: data.period.startDate
                    ? new Date(data.period.startDate).toISOString().split("T")[0]
                    : "",
                  endDate: data.period.endDate
                    ? new Date(data.period.endDate).toISOString().split("T")[0]
                    : ""
                }
              : undefined,
            signatures: data.signatures || [],
            metadata: data.metadata || {}
          });
        } catch {
          newErrorToast(t("loadError"));
          goList();
        }
      })();
    } else if (mode !== "edit") {
      // Don't reset initial when entering create mode from duplicate
      if (mode !== "create") {
        setInitial(undefined);
      }
    }
  }, [mode, editingId, t]);

  const handleCreate = async (data: CertificateFormData) => {
    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };

      const payload = {
        type: data.type,
        title: data.title,
        description: data.description || undefined,
        designId: data.designId,
        recipient: {
          name: data.recipient.name,
          userId: data.recipient.userId || undefined
        },
        period:
          data.period?.startDate || data.period?.endDate
            ? {
                startDate: data.period.startDate || new Date().toISOString(),
                endDate: data.period.endDate || undefined
              }
            : undefined,
        signatures: data.signatures.length > 0 ? data.signatures : undefined,
        metadata: Object.keys(data.metadata).length > 0 ? data.metadata : undefined
      };

      const { error } = await api.admin.certificates.post(payload, { headers });

      if (!error) {
        newSuccessToast(t("created"));
        goList();
      } else {
        newErrorToast(t("createError"));
      }
    } catch {
      newErrorToast(t("createError"));
    }
  };

  const handleEdit = async (data: CertificateFormData) => {
    if (!editingId) return;

    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };

      const payload = {
        title: data.title,
        description: data.description || undefined,
        designId: data.designId,
        recipient: {
          name: data.recipient.name,
          userId: data.recipient.userId || undefined
        },
        period:
          data.period?.startDate || data.period?.endDate
            ? {
                startDate: data.period.startDate || undefined,
                endDate: data.period.endDate || undefined
              }
            : undefined,
        signatures: data.signatures.length > 0 ? data.signatures : undefined,
        metadata: Object.keys(data.metadata).length > 0 ? data.metadata : undefined
      };

      const { error } = await api.admin.certificates({ id: editingId }).patch(payload, { headers });

      if (!error) {
        newSuccessToast(t("updated"));
        goList();
      } else {
        newErrorToast(t("updateError"));
      }
    } catch {
      newErrorToast(t("updateError"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };
      const { error } = await api.admin.certificates({ id }).delete(null, { headers });

      if (!error) {
        newSuccessToast(t("deleted"));
        setRefreshToken((x) => x + 1);
      } else {
        newErrorToast(t("deleteError"));
      }
    } catch {
      newErrorToast(t("deleteError"));
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };
      const { error } = await api.admin
        .certificates({ id })
        .revoke.post({ reason: undefined }, { headers });

      if (!error) {
        newSuccessToast(t("revoked"));
        setRefreshToken((x) => x + 1);
      } else {
        newErrorToast(t("revokeError"));
      }
    } catch {
      newErrorToast(t("revokeError"));
    }
  };

  const handleReinstate = async (id: string) => {
    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };
      const { error } = await api.admin.certificates({ id }).reinstate.post(null, { headers });

      if (!error) {
        newSuccessToast(t("reinstated"));
        setRefreshToken((x) => x + 1);
      } else {
        newErrorToast(t("reinstateError"));
      }
    } catch {
      newErrorToast(t("reinstateError"));
    }
  };

  const [previewData, setPreviewData] = useState<{
    title: string;
    description?: string;
    type: "COURSE_COMPLETION" | "EVENT_ACHIEVEMENT" | "PARTICIPATION" | "VOLUNTEER";
    recipient: { name: string };
    designId: string;
    period?: { startDate?: string; endDate?: string };
    signatures?: Array<{ name?: string; role?: string }>;
    metadata?: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    if (mode === "preview" && previewId) {
      (async () => {
        try {
          const { data, error } = await api.admin.certificates({ id: previewId }).get();
          if (error || !data) return;

          setPreviewData({
            title: data.title,
            description: data.description || undefined,
            type: data.type as
              | "COURSE_COMPLETION"
              | "EVENT_ACHIEVEMENT"
              | "PARTICIPATION"
              | "VOLUNTEER",
            recipient: {
              name: data.recipient.name
            },
            designId: data.designId,
            period: data.period
              ? {
                  startDate: data.period.startDate
                    ? new Date(data.period.startDate).toISOString()
                    : undefined,
                  endDate: data.period.endDate
                    ? new Date(data.period.endDate).toISOString()
                    : undefined
                }
              : undefined,
            signatures: data.signatures || [],
            metadata: data.metadata as Record<string, unknown>
          });
        } catch {
          setPreviewData(null);
        }
      })();
    }
  }, [mode, previewId]);

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tBreadcrumbs("admin"), href: "/admin" },
          { label: tBreadcrumbs("certificates"), href: "/admin/certificates" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && tPage("title")}
          {mode === "create" && tPage("createTitle")}
          {mode === "edit" && tPage("editTitle")}
          {mode === "preview" && tPage("previewTitle")}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goList}>{tPage("backToList")}</BackButton>
        </div>
      )}

      {mode === "list" && (
        <CertificateList
          onCreate={onCreate}
          onEdit={onEdit}
          onView={onView}
          onDelete={handleDelete}
          onDuplicate={onDuplicate}
          onRevoke={handleRevoke}
          onReinstate={handleReinstate}
          refreshToken={refreshToken}
        />
      )}

      {mode === "create" && (
        <CertificateForm initial={initial} onCancel={goList} onSubmit={handleCreate} />
      )}

      {mode === "edit" && initial && (
        <CertificateForm initial={initial} onCancel={goList} onSubmit={handleEdit} />
      )}

      {mode === "preview" && previewData && <Certificate data={previewData} />}
    </Container>
  );
}
