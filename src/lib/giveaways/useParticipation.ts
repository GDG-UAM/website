"use client";

import useSWR, { SWRConfiguration } from "swr";

type ParticipationItem = {
  giveaway: {
    _id: string;
    title: string;
    description?: string;
    status: "draft" | "active" | "paused" | "closed" | "cancelled";
    startAt?: string | null;
    endAt?: string | null;
    durationS?: number | null;
    remainingS?: number | null;
  };
  entry: {
    _id: string;
    createdAt: string;
  };
};

type ParticipationResponse = {
  participating?: boolean;
  requirePhotoUsageConsent?: boolean;
  requireProfilePublic?: boolean;
  participations?: ParticipationItem[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as ParticipationResponse;
};

export function useGiveawaysParticipation(config?: SWRConfiguration) {
  const { data, error, isValidating, mutate } = useSWR<ParticipationResponse>(
    "/api/giveaways/participating",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      ...config
    }
  );

  const participating = Boolean(data?.participating);
  const participations = (data?.participations ?? []) as ParticipationItem[];
  const requirePhotoUsageConsent = Boolean(data?.requirePhotoUsageConsent);
  const requireProfilePublic = Boolean(data?.requireProfilePublic);

  return {
    data,
    participating,
    participations,
    requirePhotoUsageConsent,
    requireProfilePublic,
    isLoading: !error && !data,
    isValidating,
    error,
    mutate
  } as const;
}

// (types intentionally not exported)
