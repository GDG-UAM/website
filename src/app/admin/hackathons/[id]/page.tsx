"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { AdminNavigationButton } from "@/components/Buttons";
import { newErrorToast } from "@/components/Toast";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-weight: 600;
  font-size: 2rem;
`;

const GridContainer = styled.div`
  max-width: 800px;
  margin-top: 24px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Category = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CategoryTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ButtonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

interface HackathonInfo {
  _id: string;
  title: string;
}

export default function HackathonDashboardPage() {
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

  const handleNavigation = (path: string) => {
    router.push(`/admin/hackathons/${id}${path}`);
  };

  if (loading) return null;

  return (
    <Container>
      <Content>
        <AdminBreadcrumbs
          items={[
            { label: tNav("admin"), href: "/admin" },
            { label: tNav("hackathons"), href: "/admin/hackathons" },
            { label: hackathon?.title || "...", href: `/admin/hackathons/${id}` }
          ]}
        />
        <Title>
          {t("dashboard.title")}
          {hackathon?.title ? ` - ${hackathon.title}` : ""}
        </Title>

        <GridContainer>
          <Grid>
            {/* Track Operations */}
            <Category>
              <CategoryTitle>{t("dashboard.tracks")}</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="hackathon-tracks"
                  onClick={() => handleNavigation("/tracks")}
                >
                  {t("dashboard.tracks")}
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="hackathon-track-selection"
                  onClick={() => handleNavigation("/selection")}
                >
                  {t("dashboard.selection")}
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Team Operations */}
            <Category>
              <CategoryTitle>{t("dashboard.teams")}</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="hackathon-teams"
                  onClick={() => handleNavigation("/teams")}
                >
                  {t("dashboard.teams")}
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Presentation Operations */}
            <Category>
              <CategoryTitle>{t("dashboard.intermission")}</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="hackathon-intermission"
                  onClick={() => handleNavigation("/intermission")}
                >
                  {t("dashboard.intermission")}
                </AdminNavigationButton>
              </ButtonList>
            </Category>
          </Grid>
        </GridContainer>
      </Content>
    </Container>
  );
}
