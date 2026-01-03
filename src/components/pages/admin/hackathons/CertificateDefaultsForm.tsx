"use client";

import { useState } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { TextField } from "@mui/material";
import { SaveButton, AddButton, DeleteButton } from "@/components/Buttons";

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #374151;
`;

const SignatureRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: center;
`;

export type CertificateDefaultsData = {
  title?: string;
  signatures: Array<{
    name?: string;
    role?: string;
    imageUrl?: string;
  }>;
};

interface Props {
  initial: CertificateDefaultsData;
  onSubmit: (data: CertificateDefaultsData) => Promise<void>;
  hackathonTitle: string;
}

export default function CertificateDefaultsForm({ initial, onSubmit, hackathonTitle }: Props) {
  const t = useTranslations("admin.hackathons.certificates.form");
  const [data, setData] = useState<CertificateDefaultsData>(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(data);
    } finally {
      setSaving(false);
    }
  };

  const addSignature = () => {
    setData((prev) => ({
      ...prev,
      signatures: [...prev.signatures, { name: "", role: "", imageUrl: "" }]
    }));
  };

  const removeSignature = (index: number) => {
    setData((prev) => ({
      ...prev,
      signatures: prev.signatures.filter((_, i) => i !== index)
    }));
  };

  const updateSignature = (index: number, field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      signatures: prev.signatures.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    }));
  };

  return (
    <FormContainer>
      <Section>
        <SectionTitle>{t("title")}</SectionTitle>
        <TextField
          fullWidth
          label={t("title")}
          placeholder={hackathonTitle}
          helperText={t("titleHelp")}
          value={data.title || ""}
          onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
        />
      </Section>

      <Section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTitle>{t("signatures")}</SectionTitle>
          <AddButton onClick={addSignature} />
        </div>

        {data.signatures.map((sig, index) => (
          <SignatureRow key={index}>
            <TextField
              size="small"
              label="Name"
              value={sig.name}
              onChange={(e) => updateSignature(index, "name", e.target.value)}
            />
            <TextField
              size="small"
              label="Role"
              value={sig.role}
              onChange={(e) => updateSignature(index, "role", e.target.value)}
            />
            <TextField
              size="small"
              label="Image URL"
              value={sig.imageUrl}
              onChange={(e) => updateSignature(index, "imageUrl", e.target.value)}
            />
            <DeleteButton onClick={() => removeSignature(index)} iconSize={20} />
          </SignatureRow>
        ))}
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
        <SaveButton onClick={handleSubmit} showSpinner={saving} disabled={saving}>
          {t("save")}
        </SaveButton>
      </div>
    </FormContainer>
  );
}
