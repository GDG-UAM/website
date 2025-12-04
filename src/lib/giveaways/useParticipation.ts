"use client";
import { api } from "@/lib/eden";

import useSWR, { SWRConfiguration } from "swr";

type ParticipationItem = {
  giveaway: {
    _id: string;
    title: string;
    description?: string;
    status: "draft" | "active" | "paused" | "closed" | "cancelled";
    startAt?: Date | null;
    endAt?: Date | null;
    durationS?: number | null;
    remainingS?: number | null;
  };
  entry: {
    _id: string;
    createdAt: Date;
  };
};

type ParticipationResponse = {
  participating?: boolean;
  requirePhotoUsageConsent?: boolean;
  requireProfilePublic?: boolean;
  participations?: ParticipationItem[];
};

const fetcher = async () => {
  const { data, error } = await api.giveaways.participating.get();
  if (error) throw error;
  return data as ParticipationResponse;
};

export function useGiveawaysParticipation(config?: SWRConfiguration) {
  const { data, error, isValidating, mutate } = useSWR<ParticipationResponse>(
    "giveaways-participation",
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
