"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { SaveButton, CancelButton } from "@/components/Buttons";
import { TextField, Switch, FormControlLabel } from "@mui/material";
import { useTranslations } from "next-intl";

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 900px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
`;

const HelpText = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: -8px 0 0 0;
`;

export type LinkFormData = {
  slug: string;
  destination: string;
  title: string;
  description?: string;
  isActive: boolean;
};

export function LinkForm({
  initial,
  onCancel,
  onSubmit,
  submitting
}: {
  initial?: Partial<LinkFormData>;
  onCancel?: () => void;
  onSubmit: (data: LinkFormData) => Promise<void> | void;
  submitting?: boolean;
}) {
  const t = useTranslations("admin.links.form");
  const [data, setData] = useState<LinkFormData>({
    slug: initial?.slug || "",
    destination: initial?.destination || "",
    title: initial?.title || "",
    description: initial?.description || "",
    isActive: initial?.isActive ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
  };

  const submitForm = () => {
    const form = document.getElementById("link-form") as HTMLFormElement | null;
    form?.requestSubmit();
  };

  return (
    <Form onSubmit={handleSubmit} id="link-form">
      <TextField
        label={t("slug")}
        value={data.slug}
        onChange={(e) => setData({ ...data, slug: e.target.value })}
        required
        fullWidth
        disabled={submitting}
        helperText={t("slugHelp")}
        inputProps={{ pattern: "[a-z0-9-]+", style: { fontFamily: "monospace" } }}
      />

      <TextField
        label={t("destination")}
        value={data.destination}
        onChange={(e) => setData({ ...data, destination: e.target.value })}
        required
        fullWidth
        disabled={submitting}
        type="url"
        helperText={t("destinationHelp")}
      />

      <TextField
        label={t("title")}
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        required
        fullWidth
        disabled={submitting}
        helperText={t("titleHelp")}
      />

      <TextField
        label={t("description")}
        value={data.description || ""}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        fullWidth
        disabled={submitting}
        multiline
        rows={3}
        helperText={t("descriptionHelp")}
      />

      <FormControlLabel
        control={
          <Switch
            checked={data.isActive}
            onChange={(e) => setData({ ...data, isActive: e.target.checked })}
            disabled={submitting}
          />
        }
        label={t("isActive")}
      />
      {!data.isActive && <HelpText>{t("isActiveHelp")}</HelpText>}

      <Actions>
        <SaveButton onClick={submitForm} disabled={submitting}>
          {submitting ? t("saving") : t("save")}
        </SaveButton>
        {onCancel && (
          <CancelButton onClick={onCancel} disabled={submitting}>
            {t("cancel")}
          </CancelButton>
        )}
      </Actions>
    </Form>
  );
}
