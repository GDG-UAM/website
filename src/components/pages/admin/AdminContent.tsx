"use client";

import { useRouter } from "next/navigation";
import { AdminNavigationButton } from "@/components/Buttons";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";

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
              <CategoryTitle>Articles</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton type="blog" onClick={() => handleNavigation("/admin/blog")}>
                  Blog
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="newsletter"
                  onClick={() => handleNavigation("/admin/newsletter")}
                >
                  Newsletter
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Events Category */}
            <Category>
              <CategoryTitle>Events</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="events"
                  onClick={() => handleNavigation("/admin/events")}
                >
                  Events
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="giveaways"
                  onClick={() => handleNavigation("/admin/giveaways")}
                >
                  Giveaways
                </AdminNavigationButton>
                <AdminNavigationButton type="games" disabled>
                  Games
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Misc Category */}
            <Category>
              <CategoryTitle>Misc</CategoryTitle>
              <ButtonList>
                <AdminNavigationButton
                  type="links"
                  onClick={() => handleNavigation("/admin/links")}
                >
                  Links
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="permissions"
                  onClick={() => handleNavigation("/admin/permissions")}
                >
                  Permissions
                </AdminNavigationButton>
                <AdminNavigationButton
                  type="featureFlags"
                  onClick={() => handleNavigation("/admin/feature-flags")}
                >
                  Feature Flags
                </AdminNavigationButton>
              </ButtonList>
            </Category>

            {/* Tests Category */}
            {testRoutes.length > 0 && (
              <Category>
                <CategoryTitle>Tests</CategoryTitle>
                <ButtonList>
                  {testRoutes.map((route) => (
                    <AdminNavigationButton
                      key={route.href}
                      type={isProduction ? "test-prod" : "test-dev"}
                      onClick={() => handleNavigation(route.href)}
                      disabled={isProduction}
                      tooltip={isProduction ? "Only available in development mode" : undefined}
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
