"use client";
import React, { createContext, useContext, useCallback, useState } from "react";
import useSWR, { type KeyedMutator } from "swr";
import {
  UserSettingsDTO,
  SettingsCategoryKey,
  categorySchemas
} from "@/lib/validation/settingsSchemas";
import { z } from "zod";

async function jsonFetcher(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed ${res.status}`);
  return res.json();
}

interface SettingsContextValue {
  settings: UserSettingsDTO | null;
  isLoading: boolean;
  error: Error | null;
  updateCategory: <T extends SettingsCategoryKey>(
    category: T,
    data: CategoryPatch<T>
  ) => Promise<void>;
  mutate: KeyedMutator<UserSettingsDTO>;
  validationErrors: string[];
  lastValidationError: string | null;
}

type CategorySchemas = typeof categorySchemas;
type CategoryValue<K extends SettingsCategoryKey> = z.infer<CategorySchemas[K]>;
// Allow partial updates (PATCH semantics) by making all properties optional recursively at first level.
type CategoryPatch<K extends SettingsCategoryKey> = Partial<CategoryValue<K>>;

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Base fetch without previews; SettingsClient can fetch previews explicitly
  const { data, error, isLoading, mutate } = useSWR<UserSettingsDTO>("/api/settings", jsonFetcher, {
    revalidateOnFocus: false
  });
  const [pending, setPending] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastValidationError, setLastValidationError] = useState<string | null>(null);

  const updateCategory = useCallback(
    async <T extends SettingsCategoryKey>(category: T, patch: CategoryPatch<T>) => {
      const schema = categorySchemas[category] as CategorySchemas[T];
      // Validate client side (collect zod issues into context state)
      try {
        schema.partial().parse(patch);
      } catch (e) {
        if (e instanceof z.ZodError) {
          const msgs = e.issues.map((i) => `${i.path.join(".") || category}: ${i.message}`);
          setValidationErrors((prev) => [...prev, ...msgs]);
          setLastValidationError(msgs[msgs.length - 1] || null);
          return; // abort update
        }
        throw e;
      }
      setPending(true);
      try {
        // Optimistic update
        mutate(
          async () => {
            const res = await fetch(`/api/settings/${category}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch)
            });
            if (!res.ok) throw new Error("Update failed");
            const updated = await res.json();
            return updated;
          },
          { revalidate: false }
        );
      } finally {
        setPending(false);
      }
    },
    [mutate]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings: data || null,
        isLoading: isLoading || pending,
        error: error as Error | null,
        updateCategory,
        mutate,
        validationErrors,
        lastValidationError
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
