"use client";
import React, { useEffect, useState } from "react";
import { FormControl, MenuItem, Radio, RadioGroup, Select, FormControlLabel } from "@mui/material";
import { Section } from "./common";
import type { GeneralSettings } from "@/lib/validation/settingsSchemas";

const GeneralSection: React.FC<{
  value?: GeneralSettings;
  onChange: (v: Partial<GeneralSettings>) => void;
  t: (k: string) => string;
}> = ({ value, onChange, t }) => {
  const [timeFormat, setTimeFormat] = useState<GeneralSettings["timeFormat"]>(
    value?.timeFormat || "24h"
  );
  const [firstDay, setFirstDay] = useState<GeneralSettings["firstDayOfWeek"]>(
    value?.firstDayOfWeek || "monday"
  );
  useEffect(() => {
    if (value) {
      setTimeFormat(value.timeFormat);
      setFirstDay(value.firstDayOfWeek);
    }
  }, [value]);
  return (
    <>
      <Section title={t("general.timeFormat.label")}>
        <FormControl>
          <RadioGroup
            row
            value={timeFormat}
            onChange={(e) => {
              const v = e.target.value as GeneralSettings["timeFormat"];
              setTimeFormat(v);
              onChange({ timeFormat: v, firstDayOfWeek: firstDay });
            }}
          >
            <FormControlLabel
              value="24h"
              control={<Radio />}
              label={t("general.timeFormat.formats.24h")}
            />
            <FormControlLabel
              value="12h"
              control={<Radio />}
              label={t("general.timeFormat.formats.12h")}
            />
          </RadioGroup>
        </FormControl>
      </Section>
      <Section title={t("general.firstDay.label")}>
        <FormControl size="small">
          <Select
            value={firstDay}
            style={{ background: "var(--color-white)" }}
            onChange={(e) => {
              const v = e.target.value as GeneralSettings["firstDayOfWeek"];
              setFirstDay(v);
              onChange({ timeFormat, firstDayOfWeek: v });
            }}
          >
            <MenuItem value="monday">{t("general.firstDay.monday")}</MenuItem>
            <MenuItem value="sunday">{t("general.firstDay.sunday")}</MenuItem>
          </Select>
        </FormControl>
      </Section>
    </>
  );
};

export default GeneralSection;
