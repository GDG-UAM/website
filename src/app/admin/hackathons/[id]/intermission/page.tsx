"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { BackButton } from "@/components/Buttons";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import {
  IntermissionData,
  IntermissionForm
} from "@/components/pages/admin/hackathons/intermission/IntermissionForm";
import { getCsrfToken } from "@/lib/security/csrfClient";
import { api } from "@/lib/eden";

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: 8px;
  }
`;

const Header = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

interface HackathonInfo {
  _id: string;
  title: string;
  intermission?: IntermissionData;
}

export default function HackathonIntermissionPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admin.hackathons");
  const tNav = useTranslations("admin.breadcrumbs");
  const id = params?.id as string;

  const [hackathon, setHackathon] = useState<HackathonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const res = await api.admin.hackathons({ id }).get();
        if (res.error) throw new Error();
        setHackathon(res.data as HackathonInfo);
      } catch {
        newErrorToast(t("toasts.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchHackathon();
  }, [id, t]);

  const handleSubmit = async (intermissionData: IntermissionData) => {
    setSubmitting(true);
    try {
      const csrf = await getCsrfToken();
      const res = await api.admin
        .hackathons({ id })
        .patch({ intermission: intermissionData }, { headers: { "x-csrf-token": csrf || "" } });

      if (res.error) throw new Error();

      newSuccessToast(t("toasts.updated"));
    } catch {
      newErrorToast(t("toasts.updateError"));
    } finally {
      setSubmitting(false);
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
          { label: t("dashboard.intermission"), href: `/admin/hackathons/${id}/intermission` }
        ]}
      />

      <Header>
        <Title>{t("dashboard.intermission")}</Title>
      </Header>

      <div style={{ marginBottom: "20px" }}>
        <BackButton onClick={() => router.push(`/admin/hackathons/${id}`)}>
          {t("form.backToList")}
        </BackButton>
      </div>

      <IntermissionForm
        initial={hackathon?.intermission}
        onSubmit={handleSubmit}
        submitting={submitting}
        onCancel={() => router.push(`/admin/hackathons/${id}`)}
      />
    </Container>
  );
}
