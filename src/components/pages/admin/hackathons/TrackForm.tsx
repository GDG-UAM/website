"use client";
import { useState } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { TextField } from "@mui/material";
import { AddButton, DeleteButton, SaveButton, CancelButton } from "@/components/Buttons";
import UserSelector from "@/components/forms/UserSelector";

const Form = styled.form`
  display: grid;
  gap: 12px;
  max-width: 600px;
  width: 100%;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
`;

const RubricRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 80px 40px;
  gap: 8px;
  align-items: center;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const SectionTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
`;

export type RubricFormData = {
  name: string;
  maxScore: number;
  weight?: number;
};

export type TrackFormData = {
  name: string;
  judges: string[];
  rubrics: RubricFormData[];
};

function TrackForm({
  initial,
  onCancel,
  onSubmit
}: {
  initial?: Partial<TrackFormData>;
  onCancel?: () => void;
  onSubmit: (data: TrackFormData) => Promise<void> | void;
}) {
  const t = useTranslations("admin.hackathons.tracks.form");
  const [data, setData] = useState<TrackFormData>({
    name: initial?.name || "",
    judges: initial?.judges || [],
    rubrics: initial?.rubrics || []
  });

  const addRubricItem = () => {
    setData({
      ...data,
      rubrics: [...data.rubrics, { name: "", maxScore: 10, weight: 1 }]
    });
  };

  const removeRubricItem = (index: number) => {
    setData({
      ...data,
      rubrics: data.rubrics.filter((_, i) => i !== index)
    });
  };

  const updateRubricItem = (index: number, field: keyof RubricFormData, value: string | number) => {
    const newRubrics = [...data.rubrics];
    newRubrics[index] = { ...newRubrics[index], [field]: value };
    setData({ ...data, rubrics: newRubrics });
  };

  const handleSubmit = async () => {
    await onSubmit(data);
  };

  return (
    <Form>
      <TextField
        label={t("name")}
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        fullWidth
        required
      />

      <Section>
        <UserSelector
          label={t("judges")}
          value={data.judges}
          onChange={(ids) => setData({ ...data, judges: ids })}
          placeholder={t("addJudge") || "Add a judge..."}
        />
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>{t("rubrics") || "Rubrics"}</SectionTitle>
          <AddButton onClick={addRubricItem} iconSize={16}>
            {t("addRubric") || "Add Criterion"}
          </AddButton>
        </SectionHeader>

        {data.rubrics.map((r, i) => (
          <RubricRow key={i}>
            <TextField
              size="small"
              label={t("rubricName") || "Criterion Name"}
              value={r.name}
              onChange={(e) => updateRubricItem(i, "name", e.target.value)}
              required
            />
            <TextField
              size="small"
              type="number"
              label={t("maxScore") || "Max Score"}
              value={r.maxScore}
              onChange={(e) => updateRubricItem(i, "maxScore", Number(e.target.value))}
              required
            />
            <TextField
              size="small"
              type="number"
              label={t("weight") || "Weight"}
              value={r.weight}
              onChange={(e) => updateRubricItem(i, "weight", Number(e.target.value))}
            />
            <DeleteButton onClick={() => removeRubricItem(i)} iconSize={20} />
          </RubricRow>
        ))}
      </Section>

      <Actions>
        <SaveButton onClick={handleSubmit}>{t("save")}</SaveButton>
        {onCancel && <CancelButton onClick={onCancel}>{t("cancel")}</CancelButton>}
      </Actions>
    </Form>
  );
}

export default TrackForm;
