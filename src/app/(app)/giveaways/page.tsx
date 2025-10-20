"use client";

import { useMemo } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import LocalTime from "@/components/LocalTime";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useGiveawaysParticipation } from "@/lib/giveaways/useParticipation"; // Keep this line for context
import { GiveawayCard } from "@/components/cards/GiveawayCard";

// Removed unused Participation type

export default function UserGiveawaysPage() {
  const t = useTranslations("giveaways.myGiveaways");
  const { settings } = useSettings();
  const hour12 = (settings?.general.timeFormat ?? "24h") === "12h";
  const dateTimeOptions = useMemo<Intl.DateTimeFormatOptions>(
    () => ({ hourCycle: hour12 ? "h12" : "h23" }),
    [hour12]
  );
  const {
    participations: items,
    isLoading,
    error
  } = useGiveawaysParticipation({ revalidateOnFocus: false });

  return (
    <PageWrapper>
      <Header>
        <Title>{t("title")}</Title>
      </Header>

      {isLoading ? (
        <CardsGrid>
          {Array.from({ length: 3 }).map((_, i) => (
            <GiveawayCard key={`skeleton-${i}`} skeleton />
          ))}
        </CardsGrid>
      ) : error ? (
        <ErrorBox>{String(error)}</ErrorBox>
      ) : items.length === 0 ? (
        <EmptyState>{t("noParticipations")}</EmptyState>
      ) : (
        <CardsGrid>
          {items.map((p) => {
            const g = p.giveaway;
            const href = `/giveaways/${g._id}`;
            const statusLabel = t(`status.${g.status}`);
            return (
              <GiveawayCard
                key={p.entry._id}
                href={href}
                title={g.title}
                description={g.description}
                joinedAtNode={t.rich("joinedAt", {
                  date: () => (
                    <LocalTime iso={p.entry.createdAt} dateOnly={false} options={dateTimeOptions} />
                  )
                })}
                statusLabel={statusLabel}
                statusClass={g.status}
              />
            );
          })}
        </CardsGrid>
      )}
    </PageWrapper>
  );
}

const ErrorBox = styled.div`
  color: var(--google-red);
`;

const EmptyState = styled.div`
  color: var(--color-gray-500);
`;

const PageWrapper = styled.div`
  padding: 40px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  gap: 32px;
  margin-top: 32px;
`;
