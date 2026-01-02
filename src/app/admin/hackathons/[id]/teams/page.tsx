"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { BackButton } from "@/components/Buttons";
import { newErrorToast } from "@/components/Toast";

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

const Placeholder = styled.div`
  padding: 40px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #666;
`;

interface HackathonInfo {
  _id: string;
  title: string;
}

export default function HackathonTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admin.hackathons");
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

  if (loading) return null;

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tNav("admin"), href: "/admin" },
          { label: tNav("hackathons"), href: "/admin/hackathons" },
          { label: hackathon?.title || "...", href: `/admin/hackathons/${id}` },
          { label: t("dashboard.teams"), href: `/admin/hackathons/${id}/teams` }
        ]}
      />

      <Header>
        <Title>{t("dashboard.teams")}</Title>
      </Header>

      <div style={{ marginBottom: "20px" }}>
        <BackButton onClick={() => router.push(`/admin/hackathons/${id}`)}>
          {t("form.backToList")}
        </BackButton>
      </div>

      <Placeholder>
        <h2>WORK IN PROGRESS</h2>
      </Placeholder>
    </Container>
  );
}
