"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { SaveButton, CancelButton } from "@/components/Buttons";
import { TextField } from "@mui/material";
import { useTranslations } from "next-intl";

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 900px;
  width: 100%;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export type HackathonFormData = {
  title: string;
  date: string;
  endDate: string;
  location?: string;
};

export function HackathonForm({
  initial,
  onCancel,
  onSubmit,
  submitting
}: {
  initial?: Partial<HackathonFormData>;
  onCancel?: () => void;
  onSubmit: (data: HackathonFormData) => Promise<void> | void;
  submitting?: boolean;
}) {
  const t = useTranslations("admin.hackathons.form");
  const [data, setData] = useState<HackathonFormData>({
    title: initial?.title || "",
    date: initial?.date || "",
    endDate: initial?.endDate || "",
    location: initial?.location || ""
  });

  useEffect(() => {
    if (initial) {
      setData({
        title: initial.title || "",
        date: initial.date || "",
        endDate: initial.endDate || "",
        location: initial.location || ""
      });
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
  };

  const submitForm = () => {
    const form = document.getElementById("hackathon-form") as HTMLFormElement | null;
    form?.requestSubmit();
  };

  return (
    <Form onSubmit={handleSubmit} id="hackathon-form">
      <TextField
        label={t("title")}
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        required
        fullWidth
        disabled={submitting}
      />

      <TwoCol>
        <TextField
          label={t("date")}
          type="date"
          value={data.date}
          onChange={(e) => setData({ ...data, date: e.target.value })}
          required
          fullWidth
          disabled={submitting}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label={t("endDate")}
          type="date"
          value={data.endDate}
          onChange={(e) => setData({ ...data, endDate: e.target.value })}
          required
          fullWidth
          disabled={submitting}
          InputLabelProps={{ shrink: true }}
        />
      </TwoCol>

      <TextField
        label={t("location")}
        value={data.location}
        onChange={(e) => setData({ ...data, location: e.target.value })}
        fullWidth
        disabled={submitting}
      />

      <Actions>
        <SaveButton onClick={submitForm} disabled={submitting}>
          {t("save")}
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
