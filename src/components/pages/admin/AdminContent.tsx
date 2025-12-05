"use client";

import { useRouter } from "next/navigation";
import { AdminNavigationButton } from "@/components/Buttons";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { useTranslations } from "next-intl";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-weight: 600;
`;

const GridContainer = styled.div`
  max-width: 800px;
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

interface TestRoute {
  label: string;
  href: string;
}

interface AdminContentProps {
  testRoutes: TestRoute[];
}

export default function AdminContent({ testRoutes }: AdminContentProps) {
  const router = useRouter();
  const t = useTranslations("admin.navigation");
  const isProduction = process.env.NODE_ENV === "production";

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <Container>
      <Content>
        <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }]} />
        <Title>Admin</Title>

        <GridContainer>
          <Grid>
            {/* Articles Category */}
            <Category>
              <CategoryTitle>{t("categories.articles")}</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton type="blog" onClick={() => handleNavigation("/admin/blog")}>
                  {t("blog")}
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="newsletter"
                  onClick={() => handleNavigation("/admin/newsletter")}
                >
                  {t("newsletter")}
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Events Category */}
            <Category>
              <CategoryTitle>{t("categories.events")}</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="events"
                  onClick={() => handleNavigation("/admin/events")}
                >
                  {t("events")}
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="giveaways"
                  onClick={() => handleNavigation("/admin/giveaways")}
                >
                  {t("giveaways")}
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="certificates"
                  onClick={() => handleNavigation("/admin/certificates")}
                >
                  {t("certificates")}
                </AdminNavigationButton>
                <AdminNavigationButton type="games" disabled>
                  {t("games")}
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Misc Category */}
            <Category>
              <CategoryTitle>{t("categories.misc")}</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="links"
                  onClick={() => handleNavigation("/admin/links")}
                >
                  {t("links")}
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="permissions"
                  onClick={() => handleNavigation("/admin/permissions")}
                >
                  {t("permissions")}
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="featureFlags"
                  onClick={() => handleNavigation("/admin/feature-flags")}
                >
                  {t("featureFlags")}
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Tests Category */}
            {testRoutes.length > 0 && (
              <Category>
                <CategoryTitle>{t("categories.tests")}</CategoryTitle>
                <ButtonList>
                  {testRoutes.map((route) => (
                    <AdminNavigationButton
                      key={route.href}
                      type={isProduction ? "test-prod" : "test-dev"}
                      onClick={() => handleNavigation(route.href)}
                      disabled={isProduction}
                      tooltip={isProduction ? t("testTooltip") : undefined}
                    >
                      {route.label}
                    </AdminNavigationButton>
                  ))}
                </ButtonList>
              </Category>
            )}
          </Grid>
        </GridContainer>
      </Content>
    </Container>
  );
}
