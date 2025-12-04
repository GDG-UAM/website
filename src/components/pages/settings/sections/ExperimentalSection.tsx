"use client";
import { api } from "@/lib/eden";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Checkbox, Stack, Typography } from "@mui/material";
import type { ExperimentalSettings } from "@/lib/validation/settingsSchemas";
import styled from "styled-components";

const Chip = styled.span<{ $isDisabled?: boolean }>`
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px 3px;
  border-radius: 999px;
  background: ${({ $isDisabled }) =>
    $isDisabled ? "var(--settings-chip-disabled-bg)" : "var(--settings-chip-bg)"};
  color: ${({ $isDisabled }) =>
    $isDisabled ? "var(--settings-chip-disabled-text)" : "var(--settings-chip-text)"};
  font-weight: 500;
  margin-left: 8px;
`;

type FlagListItem = {
  key: string;
  environment: "development" | "production";
  name?: string;
  description?: string;
};

const ExperimentalSection: React.FC<{
  value?: ExperimentalSettings;
  onChange: (v: Partial<ExperimentalSettings>) => void;
  t: (k: string) => string;
}> = ({ value, onChange, t }) => {
  const overrides = useMemo(() => value?.overrides || {}, [value?.overrides]);
  const [local, setLocal] = useState(overrides);
  const [flags, setFlags] = useState<FlagListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isProd = typeof window !== "undefined" ? process.env.NODE_ENV !== "development" : false;
  useEffect(() => {
    setLocal(overrides);
  }, [overrides]);
  useEffect(() => {
    let aborted = false;
    setLoading(true);
    api["feature-flags"]
      .get()
      .then(({ data }) => {
        if (!aborted && data && Array.isArray(data.items))
          setFlags(
            (data.items as Array<Record<string, unknown>>).map((f) => ({
              key: String(f.key),
              environment: (f.environment as FlagListItem["environment"]) || "development",
              name: typeof f.name === "string" ? f.name : undefined,
              description: typeof f.description === "string" ? f.description : undefined
            }))
          );
      })
      .catch(() => {})
      .finally(() => !aborted && setLoading(false));
    return () => {
      aborted = true;
    };
  }, []);
  const cycleOverride = (flag: string) => () => {
    const curr = local[flag] as boolean | undefined;
    const next = { ...local } as Record<string, boolean>;
    if (curr === undefined) next[flag] = true;
    else if (curr === true) next[flag] = false;
    else delete next[flag];
    setLocal(next);
    onChange({ overrides: next });
  };
  const knownKeys = flags.map((f) => f.key);
  const orphanOverrideKeys = Object.keys(local).filter((k) => !knownKeys.includes(k));
  const allItems: Array<FlagListItem | { key: string }> = [
    ...flags,
    ...orphanOverrideKeys.map((k) => ({ key: k }))
  ].sort((a, b) => a.key.localeCompare(b.key));
  return (
    <Stack spacing={1.2} data-no-ai-translate>
      {loading && (
        <Typography variant="caption" color="text.secondary">
          {t("experimental.loadingFlags")}
        </Typography>
      )}
      {!loading && allItems.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("experimental.noFlags")}
        </Typography>
      )}
      {allItems.map((item) => {
        const k = item.key;
        const hasMeta = (i: typeof item): i is FlagListItem => "environment" in i;
        const env = hasMeta(item) ? item.environment : undefined;
        const name = hasMeta(item) ? item.name : undefined;
        const description = hasMeta(item) ? item.description : undefined;
        const override = local[k] as boolean | undefined;
        const checked = override === true;
        const indeterminate = override === undefined;
        const disabled = isProd && env === "development";
        return (
          <Box
            key={k}
            sx={{
              border: "1px solid var(--settings-preview-box-border)",
              borderRadius: 1,
              p: 1.2,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "center",
              gap: 1.2,
              background: "var(--color-white)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={!disabled && checked}
                indeterminate={disabled || indeterminate}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled) cycleOverride(k)();
                }}
                disabled={disabled}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack spacing={0.5}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {name || k}
                  </Typography>
                  {env && (
                    <Chip $isDisabled={disabled}>{env === "development" ? "dev" : "prod"}</Chip>
                  )}
                </Box>
                {description && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {description}
                  </Typography>
                )}
                <Typography
                  component="code"
                  sx={{ fontSize: 12, color: "var(--settings-socials-meta-text)" }}
                  title={k}
                >
                  {k}
                </Typography>
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};

export default ExperimentalSection;
