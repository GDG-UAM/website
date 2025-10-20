"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { SaveButton, CancelButton } from "@/components/Buttons";
import { TextField, Switch, FormControlLabel } from "@mui/material";

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 900px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
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
        label="Slug (Short URL)"
        value={data.slug}
        onChange={(e) => setData({ ...data, slug: e.target.value })}
        required
        fullWidth
        disabled={submitting}
        helperText="Only lowercase letters, numbers, and hyphens (e.g., 'discord', 'meeting-link')"
        inputProps={{ pattern: "[a-z0-9-]+", style: { fontFamily: "monospace" } }}
      />

      <TextField
        label="Destination URL"
        value={data.destination}
        onChange={(e) => setData({ ...data, destination: e.target.value })}
        required
        fullWidth
        disabled={submitting}
        type="url"
        helperText="Full URL where this link should redirect (e.g., 'https://discord.gg/xyz')"
      />

      <TextField
        label="Title"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        required
        fullWidth
        disabled={submitting}
        helperText="Human-readable name for this link"
      />

      <TextField
        label="Description (Optional)"
        value={data.description || ""}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        fullWidth
        disabled={submitting}
        multiline
        rows={3}
        helperText="Optional notes or description for internal reference"
      />

      <FormControlLabel
        control={
          <Switch
            checked={data.isActive}
            onChange={(e) => setData({ ...data, isActive: e.target.checked })}
            disabled={submitting}
          />
        }
        label="Active"
      />
      {!data.isActive && <HelpText>Inactive links will return a 404 error when accessed.</HelpText>}

      <Actions>
        <SaveButton onClick={submitForm} disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </SaveButton>
        {onCancel && (
          <CancelButton onClick={onCancel} disabled={submitting}>
            Cancel
          </CancelButton>
        )}
      </Actions>
    </Form>
  );
}
