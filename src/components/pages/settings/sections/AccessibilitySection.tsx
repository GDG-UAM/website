"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from "@mui/material";
import type { AccessibilitySettings } from "@/lib/validation/settingsSchemas";

const AccessibilitySection: React.FC<{
  value?: AccessibilitySettings;
  onChange: (v: Partial<AccessibilitySettings>) => void;
  t: (k: string) => string;
}> = ({ value, onChange, t }) => {
  const [state, setState] = useState({
    highContrast: value?.highContrast || false,
    reducedMotion: value?.reducedMotion || false,
    dyslexicFont: value?.dyslexicFont || false,
    daltonismMode: value?.daltonismMode || "none"
  });
  useEffect(() => {
    if (value) {
      setState({
        highContrast: value.highContrast,
        reducedMotion: value.reducedMotion,
        dyslexicFont: value.dyslexicFont,
        daltonismMode: value.daltonismMode || "none"
      });
    }
  }, [value]);
  const toggleBool =
    (k: "highContrast" | "reducedMotion" | "dyslexicFont") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...state, [k]: e.target.checked } as typeof state;
      setState(next);
      onChange(next);
    };
  return (
    <Stack spacing={2}>
      {/* <FormControlLabel control={<Checkbox checked={state.highContrast} onChange={toggleBool("highContrast")} />} label={t("accessibility.highContrast")} /> */}
      <FormControlLabel
        control={<Checkbox checked={state.reducedMotion} onChange={toggleBool("reducedMotion")} />}
        label={t("accessibility.reducedMotion")}
        style={{ marginLeft: 0 }}
      />
      <FormControlLabel
        control={<Checkbox checked={state.dyslexicFont} onChange={toggleBool("dyslexicFont")} />}
        label={t("accessibility.dyslexicFont")}
        style={{ marginLeft: 0 }}
      />
      <Box>
        <Typography variant="h6" gutterBottom>
          {t("accessibility.colorBlind")}
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={state.daltonismMode}
            onChange={(e) => {
              const v = e.target.value as AccessibilitySettings["daltonismMode"];
              const next = { ...state, daltonismMode: v } as typeof state;
              setState(next);
              onChange(next);
            }}
          >
            <FormControlLabel
              value="none"
              control={<Radio />}
              label={t("accessibility.daltonism.none")}
            />
            <FormControlLabel
              value="deuteranopia"
              control={<Radio />}
              label={t("accessibility.daltonism.deuteranopia")}
            />
            <FormControlLabel
              value="protanopia"
              control={<Radio />}
              label={t("accessibility.daltonism.protanopia")}
            />
            <FormControlLabel
              value="tritanopia"
              control={<Radio />}
              label={t("accessibility.daltonism.tritanopia")}
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </Stack>
  );
};

export default AccessibilitySection;
