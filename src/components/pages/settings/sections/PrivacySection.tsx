"use client";
import React, { useEffect, useState } from "react";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import Modal from "@/components/Modal";
import Link from "next/link";
import { InfoButton } from "@/components/Buttons";
import { LabelGroupContainer } from "./common";
import type { PrivacySettings } from "@/lib/validation/settingsSchemas";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useGiveawaysParticipation } from "@/lib/giveaways/useParticipation";

const privacyMap = {
  showProfilePublicly: "showProfile",
  showAttendance: "attendance",
  showResults: "results",
  allowMentionBlog: "mentionBlog",
  photoConsent: "photoConsent",
  allowTagInstagram: "tagInstagram",
  allowTagLinkedIn: "tagLinkedIn",
  allowAnonUsage: "anonUsage"
} as const;
type PrivacyLocal = Record<(typeof privacyMap)[keyof typeof privacyMap], boolean>;

const PrivacySection: React.FC<{
  value?: PrivacySettings;
  onChange: (v: Partial<PrivacySettings>) => void;
  t: (k: string) => string;
  onboarding?: boolean;
}> = ({ value, onChange, t, onboarding = false }) => {
  const { requirePhotoUsageConsent, requireProfilePublic } = useGiveawaysParticipation();
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoKey, setInfoKey] = useState<"photo" | "profile" | null>(null);
  const { settings } = useSettings();

  const DEFAULTS: PrivacyLocal = {
    showProfile: true,
    attendance: false,
    results: false,
    mentionBlog: true,
    photoConsent: true,
    tagInstagram: true,
    tagLinkedIn: true,
    anonUsage: true
  };

  const [state, setState] = useState<PrivacyLocal>(() =>
    value
      ? {
          // @ts-expect-error virtual field
          showProfile: value.showProfilePublicly,
          attendance: value.showAttendance,
          results: value.showResults,
          mentionBlog: value.allowMentionBlog,
          photoConsent: value.photoConsent,
          tagInstagram: value.allowTagInstagram,
          tagLinkedIn: value.allowTagLinkedIn,
          // @ts-expect-error virtual field
          anonUsage: value.allowAnonUsage
        }
      : DEFAULTS
  );

  useEffect(() => {
    if (!value) return;
    setState((prev) => {
      const next: PrivacyLocal = {
        // @ts-expect-error virtual field
        showProfile: value.showProfilePublicly,
        attendance: value.showAttendance,
        results: value.showResults,
        mentionBlog: value.allowMentionBlog,
        photoConsent: value.photoConsent,
        tagInstagram: value.allowTagInstagram,
        tagLinkedIn: value.allowTagLinkedIn,
        // @ts-expect-error virtual field
        anonUsage: value.allowAnonUsage
      };
      for (const k of Object.keys(next) as (keyof PrivacyLocal)[]) {
        if (next[k] !== prev[k]) return next;
      }
      return prev;
    });
  }, [value]);

  const push = (next: PrivacyLocal) => {
    const backend: Partial<PrivacySettings> = {};
    (Object.keys(privacyMap) as Array<keyof typeof privacyMap>).forEach((k) => {
      backend[k as keyof PrivacySettings] = next[privacyMap[k]] as boolean;
    });
    onChange(backend);
  };

  const toggle = (k: keyof PrivacyLocal) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.checked;
    const next: PrivacyLocal = { ...state, [k]: v } as PrivacyLocal;
    if (k === "showProfile" && !v) {
      next.attendance = false;
      next.results = false;
    }
    if (k === "photoConsent" && !v) {
      next.tagInstagram = false;
      next.tagLinkedIn = false;
    }
    setState(next);
    push(next);
  };

  const hasInstagram = Boolean(settings?.profile?.instagram);
  const hasLinkedIn = Boolean(settings?.profile?.linkedin);
  const anyEnabled = hasInstagram || hasLinkedIn;
  const effInstagram = hasInstagram && state.tagInstagram;
  const effLinkedIn = hasLinkedIn && state.tagLinkedIn;
  const allTags =
    anyEnabled && (hasInstagram ? effInstagram : true) && (hasLinkedIn ? effLinkedIn : true);
  const someTags = anyEnabled && (effInstagram || effLinkedIn) && !allTags;

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.checked;
    const next: PrivacyLocal = { ...state };
    if (hasInstagram) next.tagInstagram = v;
    if (hasLinkedIn) next.tagLinkedIn = v;
    setState(next);
    push(next);
  };

  return (
    <>
      <Stack spacing={2}>
        {/* Show profile publicly */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FormControlLabel
            control={<Checkbox checked={state.showProfile} onChange={toggle("showProfile")} />}
            label={t("privacy.showProfile")}
            disabled={requireProfilePublic}
            style={{ marginLeft: 0 }}
          />
          {requireProfilePublic && (
            <div style={{ marginLeft: -16 }}>
              <InfoButton
                iconSize={18}
                onClick={() => {
                  setInfoKey("profile");
                  setInfoOpen(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Attendance / Results */}
        {!onboarding && (
          <>
            <FormControlLabel
              control={<Checkbox checked={state.attendance} onChange={toggle("attendance")} />}
              label={t("privacy.attendance")}
              disabled={!state.showProfile}
              style={{ marginLeft: 0 }}
            />
            <FormControlLabel
              control={<Checkbox checked={state.results} onChange={toggle("results")} />}
              label={t("privacy.results")}
              disabled={!state.showProfile}
              style={{ marginLeft: 0 }}
            />

            {/* Mention blog */}
            <FormControlLabel
              control={<Checkbox checked={state.mentionBlog} onChange={toggle("mentionBlog")} />}
              label={t("privacy.mentionBlog")}
              style={{ marginLeft: 0 }}
            />
          </>
        )}

        {/* Photo consent */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FormControlLabel
            control={<Checkbox checked={state.photoConsent} onChange={toggle("photoConsent")} />}
            label={t("privacy.photoConsent")}
            disabled={requirePhotoUsageConsent}
            style={{ marginLeft: 0 }}
          />
          {requirePhotoUsageConsent && (
            <div style={{ marginLeft: -16 }}>
              <InfoButton
                iconSize={18}
                onClick={() => {
                  setInfoKey("photo");
                  setInfoOpen(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Tagging */}
        {!onboarding && (
          <LabelGroupContainer>
            <FormControlLabel
              control={
                <Checkbox
                  indeterminate={someTags}
                  checked={allTags}
                  onChange={toggleAll}
                  disabled={!state.photoConsent || !anyEnabled}
                />
              }
              label={t("privacy.tagging.group")}
              style={{ marginLeft: 0 }}
            />
            <Stack pl={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasInstagram && state.tagInstagram}
                    onChange={toggle("tagInstagram")}
                    disabled={!state.photoConsent || !hasInstagram}
                  />
                }
                label={t("privacy.tagging.instagram")}
                style={{ marginLeft: 0 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasLinkedIn && state.tagLinkedIn}
                    onChange={toggle("tagLinkedIn")}
                    disabled={!state.photoConsent || !hasLinkedIn}
                  />
                }
                label={t("privacy.tagging.linkedin")}
                style={{ marginLeft: 0 }}
              />
            </Stack>
          </LabelGroupContainer>
        )}

        {/* Anonymized usage */}
        {/* <FormControlLabel
          control={<Checkbox checked={state.anonUsage} onChange={toggle("anonUsage")} />}
          label={t("privacy.anonUsage")}
          style={{ marginLeft: 0 }}
        /> */}
      </Stack>

      {/* Info modal */}
      <Modal
        title={infoKey ? t("giveaways.lock.title") : undefined}
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        buttons={[]}
      >
        <div>
          {infoKey
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (t as any).rich(`giveaways.lock.${infoKey}`, {
                link: (chunks: React.ReactNode) => (
                  <Link href="/giveaways" target="_blank" rel="noopener noreferrer">
                    {chunks}
                  </Link>
                )
              })
            : null}
        </div>
      </Modal>
    </>
  );
};

export default PrivacySection;
