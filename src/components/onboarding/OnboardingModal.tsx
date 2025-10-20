"use client";
import React, { useState } from "react";
import styled from "styled-components";
import Modal from "@/components/Modal";
import { NextButton, BackButton, AcceptButton } from "@/components/Buttons";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useSession } from "next-auth/react";
import PrivacySection from "@/components/pages/settings/sections/PrivacySection";
import { useTranslations } from "next-intl";
import ProfileSection from "../pages/settings/sections/ProfileSection";
import { Checkbox, FormControlLabel } from "@mui/material";

const PageContainer = styled.div`
  min-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const IntroParagraph = styled.p`
  line-height: 1.5;
  margin: 0;
`;

const Dots = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => (p.$active ? "var(--color-primary)" : "var(--color-border)")};
  transition: background 0.2s;
`;

const SectionHeading = styled.h2`
  margin: 8px 0 4px;
`;

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onComplete }) => {
  const { settings, updateCategory } = useSettings();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations("settings");

  const onToggleShowAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(e.target.checked);
  };

  const pages: React.ReactNode[] = [
    <PageContainer key="intro">
      <IntroParagraph>{t("onboarding.intro")}</IntroParagraph>
    </PageContainer>,
    <PageContainer key="profile">
      <FormControlLabel
        control={<Checkbox checked={showAll} onChange={onToggleShowAll} />}
        label={t("onboarding.showAll", { default: "Show all settings" })}
        style={{ marginLeft: 0 }}
      />
      <SectionHeading>{t("onboarding.profileTitle", { default: "Profile" })}</SectionHeading>
      <ProfileSection
        value={settings?.profile}
        onChange={(v) => updateCategory("profile", v)}
        t={t as unknown as (k: string) => string}
        onboarding={!showAll}
        hideAccountButtons
      />
    </PageContainer>,
    <PageContainer key="privacy">
      <FormControlLabel
        control={<Checkbox checked={showAll} onChange={onToggleShowAll} />}
        label={t("onboarding.showAll", { default: "Show all settings" })}
        style={{ marginLeft: 0 }}
      />
      <SectionHeading>{t("onboarding.privacyTitle", { default: "Privacy" })}</SectionHeading>
      <PrivacySection
        value={settings?.privacy}
        onChange={(v) => updateCategory("privacy", v)}
        t={t as unknown as (k: string) => string}
        onboarding={!showAll}
      />
    </PageContainer>,
    <PageContainer key="finish">
      <SectionHeading>{t("onboarding.finishTitle", { default: "All set" })}</SectionHeading>
      <IntroParagraph>
        {t("onboarding.finishMessage", {
          default: "You're ready to go. You can fine‑tune more options later in Settings."
        })}
      </IntroParagraph>
    </PageContainer>
  ];

  const totalSteps = pages.length;

  const next = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  };
  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const finish = async () => {
    try {
      await fetch("/api/settings/activate", { method: "POST" });
    } catch {}
    try {
      await updateSession();
    } catch {}
    onComplete();
  };

  return (
    <Modal
      isOpen={open}
      title={t("onboarding.title")}
      buttons={(() => {
        const arr: React.ReactNode[] = [];
        arr.push(<BackButton key="back" onClick={prev} disabled={step === 0} />);
        if (step < totalSteps - 1) arr.push(<NextButton key="next" onClick={next} />);
        else arr.push(<AcceptButton color="success" key="accept" onClick={finish} showSpinner />);
        return arr;
      })()}
      buttonPosition="right"
      width="sm"
    >
      {pages[step]}
      <Dots>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <Dot key={i} $active={i === step} />
        ))}
      </Dots>
    </Modal>
  );
};

export default OnboardingModal;
