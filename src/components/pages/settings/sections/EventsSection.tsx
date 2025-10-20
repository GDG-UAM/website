"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, FormControl, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { FaExclamationCircle } from "react-icons/fa";
import { DEBOUNCE_COMMIT_MS } from "./common";
import type { EventsSettings } from "@/lib/validation/settingsSchemas";
import { eventsSchema } from "@/lib/validation/settingsSchemas";

const EventsSection: React.FC<{
  value?: EventsSettings;
  onChange: (v: Partial<EventsSettings>) => void;
  t: (k: string) => string;
}> = ({ value, onChange, t }) => {
  const [dietary, setDietary] = useState((value?.dietary || "").trim());
  const [tshirt, setTshirt] = useState<EventsSettings["tshirtSize"]>(value?.tshirtSize || "M");
  const originalRef = useRef<EventsSettings | undefined>(value);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirtyRef = useRef<{ dietary: boolean }>({ dietary: false });
  useEffect(() => {
    if (!value) return;
    if (!dirtyRef.current.dietary || value.dietary === dietary) {
      setDietary((prev) => (errors.dietary ? prev : value.dietary || ""));
      if (value.dietary === dietary) dirtyRef.current.dietary = false;
    }
    setTshirt(value.tshirtSize);
    originalRef.current = value;
    setErrors((prev) => {
      if (value.dietary && value.dietary.length <= 200) {
        const { dietary: d, ...rest } = prev;
        void d;
        return rest;
      }
      return prev;
    });
  }, [value, errors.dietary, dietary]);
  const commit = useCallback(() => {
    const orig = originalRef.current;
    if (!orig) {
      const trimmed = dietary.trim();
      onChange({ dietary: trimmed || undefined, tshirtSize: tshirt });
      return;
    }
    const patch: Partial<EventsSettings> = {};
    const trimmed = dietary.trim();
    if ((trimmed || "") !== (orig.dietary || "").trim()) {
      if (trimmed === "") {
        setErrors((p) => {
          const c = { ...p };
          delete c.dietary;
          return c;
        });
        patch.dietary = "";
      } else {
        const res = eventsSchema.pick({ dietary: true }).safeParse({ dietary: trimmed });
        if (!res.success) {
          const msg = res.error.issues[0]?.message || "Invalid";
          setErrors((p) => ({
            ...p,
            dietary:
              msg === "String must contain at most 200 character(s)"
                ? t("events.errors.dietaryMax")
                : msg
          }));
        } else {
          setErrors((p) => {
            const c = { ...p };
            delete c.dietary;
            return c;
          });
          patch.dietary = trimmed;
        }
      }
    }
    if (tshirt !== orig.tshirtSize) patch.tshirtSize = tshirt;
    if (Object.keys(patch).length) onChange(patch);
  }, [dietary, tshirt, onChange, t]);
  useEffect(() => {
    const handle = setTimeout(() => commit(), DEBOUNCE_COMMIT_MS);
    return () => clearTimeout(handle);
  }, [dietary, tshirt, commit]);
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t("events.dietary")}
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={dietary}
          placeholder={t("events.dietaryPlaceholder")}
          onChange={(e) => {
            dirtyRef.current.dietary = true;
            setDietary(e.target.value);
          }}
          onBlur={commit}
          error={!!errors.dietary}
          helperText={errors.dietary}
          InputProps={{
            endAdornment: errors.dietary ? (
              <FaExclamationCircle color="var(--settings-input-error)" size={16} />
            ) : undefined
          }}
        />
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t("events.tshirt")}
        </Typography>
        <FormControl size="small">
          <Select
            value={tshirt}
            style={{ background: "var(--color-white)" }}
            onChange={(e) => {
              const v = e.target.value as EventsSettings["tshirtSize"];
              setTshirt(v);
              onChange({ dietary: dietary || undefined, tshirtSize: v });
            }}
          >
            {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Stack>
  );
};

export default EventsSection;
