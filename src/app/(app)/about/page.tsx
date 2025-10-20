"use client";

import styled from "styled-components";
import { useTranslations } from "next-intl";
import { Socials } from "@/components/Socials";
import InfoCard from "@/components/cards/InfoCard";
import ProfileCard from "@/components/pages/about/ProfileCard";
import useSWR from "swr";

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 40px 32px 80px;
`;

const ContentWrapper = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const Section = styled.section`
  margin-bottom: 72px;
`;

const MainTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 12px;
  margin-top: 0;
`;

const MainSubtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--google-light-gray);
`;

const StyledParagraph = styled.p`
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--google-dark-gray);
  max-width: 900px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--google-dark-gray);
`;

const CardTitle = styled.h4`
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--google-dark-gray);
  margin-bottom: 8px;
`;

const CardText = styled.p`
  font-size: 1rem;
  color: var(--google-light-gray);
  line-height: 1.6;
`;

const Divider = styled.hr`
  margin: 64px 0;
  border: none;
  border-top: 1px solid var(--color-gray-300);
`;

const Disclaimer = styled.div`
  margin-top: 40px;
  padding: 24px;
  background-color: var(--google-super-light-gray);
  border-left: 4px solid var(--google-blue);
  border-radius: 8px;
  color: var(--google-light-gray);
  font-size: 0.9rem;
  max-width: 900px;
`;

const SocialsContainer = styled.div`
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const TeamContainer = styled.div`
  margin-top: 32px;
`;

const TeamGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const TeamSubtitle = styled.h4`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--google-dark-gray);
`;

export default function AboutPage() {
  const t = useTranslations("about");
  // Inline, module-scope constants to avoid re-creating per render
  const missionColors = [
    "var(--google-blue)",
    "var(--google-red)",
    "var(--google-yellow)",
    "var(--google-green)"
  ] as const;
  const whatWeDoColors = [
    "var(--google-green)",
    "var(--google-blue)",
    "var(--google-yellow)",
    "var(--google-red)"
  ] as const;

  return (
    <PageContainer>
      <ContentWrapper>
        <MainTitle>{t("title")}</MainTitle>
        <MainSubtitle data-no-ai-translate>
          {t.rich("subtitle", {
            g: (chunks) => {
              const colors = [
                "var(--google-blue)",
                "var(--google-red)",
                "var(--google-yellow)",
                "var(--google-blue)",
                "var(--google-green)",
                "var(--google-red)"
              ];
              const text = String(chunks);
              return (
                <span
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    Array.from(target.children).forEach((child, i) => {
                      (child as HTMLElement).style.color = colors[i % colors.length];
                    });
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    Array.from(target.children).forEach((child) => {
                      (child as HTMLElement).style.color = "inherit";
                    });
                  }}
                >
                  {text.split("").map((char, i) => (
                    <span key={i} style={{ transition: "color 0.5s" }}>
                      {char}
                    </span>
                  ))}
                </span>
              );
            },
            uni: (chunks) => (
              <span style={{ color: "var(--google-green)", fontWeight: 600 }}>{chunks}</span>
            )
          })}
        </MainSubtitle>
        <StyledParagraph>{t("intro")}</StyledParagraph>

        <Divider />

        <Section>
          <SectionTitle style={{ color: "var(--google-blue)" }}>{t("missionTitle")}</SectionTitle>
          <Grid>
            {Array.from({ length: 4 }, (_, index) => (
              <InfoCard key={index} color={missionColors[index]}>
                <CardTitle>{t(`mission.${index}.title`)}</CardTitle>
                <CardText>{t(`mission.${index}.text`)}</CardText>
              </InfoCard>
            ))}
          </Grid>
        </Section>

        <Divider />

        <Section>
          <SectionTitle style={{ color: "var(--google-red)" }}>{t("whatWeDoTitle")}</SectionTitle>
          <Grid>
            {Array.from({ length: 4 }, (_, index) => (
              <InfoCard key={index} color={whatWeDoColors[index]}>
                <CardTitle>{t(`whatWeDo.${index}.title`)}</CardTitle>
                <CardText>{t(`whatWeDo.${index}.description`)}</CardText>
              </InfoCard>
            ))}
          </Grid>
        </Section>

        <Divider />

        <Section>
          <SectionTitle style={{ color: "var(--google-yellow)" }}>{t("visionTitle")}</SectionTitle>
          <StyledParagraph>{t("vision")}</StyledParagraph>
        </Section>

        <Divider />

        <Section>
          <SectionTitle style={{ color: "var(--google-green)" }}>{t("historyTitle")}</SectionTitle>
          <StyledParagraph>{t("history")}</StyledParagraph>
          <Disclaimer
            style={{
              marginTop: 16,
              marginBottom: 0,
              fontSize: "1rem",
              fontWeight: 500,
              background: "var(--color-gray-100)",
              borderLeft: "6px solid var(--google-blue)",
              color: "var(--google-dark-gray)"
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--google-blue)" }} data-no-ai-translate>
              Google Developer Group On Campus - Universidad Autónoma de Madrid
            </span>
            <span>{t("disclaimer")}</span>
          </Disclaimer>
        </Section>

        <Divider />

        <Section>
          <SectionTitle style={{ color: "var(--google-red)" }}>{t("connectTitle")}</SectionTitle>
          <StyledParagraph>{t("connect")}</StyledParagraph>
          <SocialsContainer>
            <Socials />
          </SocialsContainer>
        </Section>

        <Divider />

        <Section>
          {/* Inline TeamSection with skeletons */}
          <SectionTitle style={{ color: "var(--google-yellow)" }}>{t("teamTitle")}</SectionTitle>
          <TeamContainer>
            <TeamSubtitle>{t("organizersTitle")}</TeamSubtitle>
            <TeamList api="/api/team" group="organizers" />
          </TeamContainer>

          <TeamContainer style={{ marginTop: 48 }}>
            <TeamSubtitle>{t("membersTitle")}</TeamSubtitle>
            <TeamList api="/api/team" group="team" />
          </TeamContainer>
        </Section>
      </ContentWrapper>
    </PageContainer>
  );
}

type TeamUser = {
  _id: string;
  name: string;
  image: string;
  showProfilePublicly: boolean;
};

type TeamPayload = { organizers: TeamUser[]; team: TeamUser[] };

function TeamList({ api, group }: { api: string; group: keyof TeamPayload }) {
  const fetcher = (url: string) =>
    fetch(url, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error("Failed to load team");
      return r.json();
    }) as Promise<TeamPayload>;

  const { data, isLoading, error } = useSWR<TeamPayload>(api, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  if (isLoading) {
    return (
      <TeamGrid>
        {Array.from({ length: group === "organizers" ? 4 : 8 }).map((_, i) => (
          <ProfileCard key={i} skeleton />
        ))}
      </TeamGrid>
    );
  }
  if (error) {
    return <p style={{ color: "var(--google-light-gray)" }}>{String(error)}</p>;
  }
  const members = data?.[group] ?? [];
  return (
    <TeamGrid>
      {members.map((m) => (
        <ProfileCard
          key={m._id}
          id={m._id}
          name={m.name}
          image={m.image}
          showProfilePublicly={m.showProfilePublicly}
        />
      ))}
    </TeamGrid>
  );
}
