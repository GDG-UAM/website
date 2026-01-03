"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { BackButton } from "@/components/Buttons";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import { api } from "@/lib/eden";
import { getCsrfToken } from "@/lib/security/csrfClient";
import CertificateDefaultsForm, {
  CertificateDefaultsData
} from "@/components/pages/admin/hackathons/CertificateDefaultsForm";

const Container = styled.div`
  padding: 20px;
  max-width: 1000px;
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

const Intro = styled.p`
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.5;
`;

interface HackathonInfo {
  _id: string;
  title: string;
  certificateDefaults?: CertificateDefaultsData;
}

export default function HackathonCertificateSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admin.hackathons");
  const tCert = useTranslations("admin.hackathons.certificates");
  const tNav = useTranslations("admin.breadcrumbs");
  const id = params?.id as string;

  const [hackathon, setHackathon] = useState<HackathonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const res = await fetch(`/api/admin/hackathons/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHackathon(data);
      } catch {
        newErrorToast(t("toasts.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchHackathon();
  }, [id, t]);

  const handleSave = async (data: CertificateDefaultsData) => {
    try {
      const token = await getCsrfToken();
      const { error } = await api.admin
        .hackathons({ id })
        .patch({ certificateDefaults: data }, { headers: { "x-csrf-token": token || "" } });
      if (error) throw error;
      newSuccessToast(tCert("form.success"));
    } catch {
      newErrorToast(t("toasts.updateError"));
    }
  };

  if (loading) return null;

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tNav("admin"), href: "/admin" },
          { label: tNav("hackathons"), href: "/admin/hackathons" },
          { label: hackathon?.title || "...", href: `/admin/hackathons/${id}` },
          { label: t("dashboard.certificates"), href: `/admin/hackathons/${id}/certificates` }
        ]}
      />

      <Header>
        <Title>{tCert("title")}</Title>
        <Intro>{tCert("intro")}</Intro>
      </Header>

      <div style={{ marginBottom: "20px" }}>
        <BackButton onClick={() => router.push(`/admin/hackathons/${id}`)}>
          {t("form.backToList")}
        </BackButton>
      </div>

      <CertificateDefaultsForm
        initial={hackathon?.certificateDefaults || { signatures: [] }}
        onSubmit={handleSave}
        hackathonTitle={hackathon?.title || ""}
      />
    </Container>
  );
}
