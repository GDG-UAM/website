"use client";
import React, { useEffect, useState } from "react";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import type { NotificationsSettings } from "@/lib/validation/settingsSchemas";

const NotificationsSection: React.FC<{
  value?: NotificationsSettings;
  onChange: (v: Partial<NotificationsSettings>) => void;
  t: (k: string) => string;
}> = ({ value, onChange, t }) => {
  const [emailMentions, setEmailMentions] = useState(value?.emailMentions || false);
  const [weekly, setWeekly] = useState(value?.weeklyNewsletter || false);
  const urgent = value?.urgentAlerts ?? true;
  useEffect(() => {
    if (value) {
      setEmailMentions(value.emailMentions);
      setWeekly(value.weeklyNewsletter);
    }
  }, [value]);
  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={
          <Checkbox
            checked={emailMentions}
            onChange={(e) => {
              const v = e.target.checked;
              setEmailMentions(v);
              onChange({ emailMentions: v, weeklyNewsletter: weekly, urgentAlerts: urgent });
            }}
          />
        }
        label={t("notifications.emailMentions")}
        style={{ marginLeft: 0 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={weekly}
            onChange={(e) => {
              const v = e.target.checked;
              setWeekly(v);
              onChange({ emailMentions: emailMentions, weeklyNewsletter: v, urgentAlerts: urgent });
            }}
          />
        }
        label={t("notifications.weekly")}
        style={{ marginLeft: 0 }}
      />
      <FormControlLabel
        disabled
        control={<Checkbox checked={urgent} />}
        label={t("notifications.urgent")}
        style={{ marginLeft: 0 }}
      />
    </Stack>
  );
};

export default NotificationsSection;
