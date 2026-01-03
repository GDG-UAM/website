"use client";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { SaveButton, CancelButton } from "@/components/Buttons";
import { useTranslations } from "next-intl";
import { TextField, MenuItem } from "@mui/material";
import { api } from "@/lib/eden";
import TeamUserSelector from "@/components/forms/TeamUserSelector";

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

export type TeamFormData = {
  name: string;
  trackId?: string | null;
  projectDescription?: string;
  users: { id: string; name: string }[];
};

function TeamForm({
  hackathonId,
  initial,
  onCancel,
  onSubmit
}: {
  hackathonId: string;
  initial?: Partial<TeamFormData>;
  onCancel?: () => void;
  onSubmit: (data: TeamFormData) => Promise<void> | void;
}) {
  const t = useTranslations("admin.hackathons.teams.form");
  const [data, setData] = useState<TeamFormData>({
    name: initial?.name || "",
    trackId: initial?.trackId || "",
    projectDescription: initial?.projectDescription || "",
    users: initial?.users || []
  });

  const [tracks, setTracks] = useState<{ _id: string; name: string }[]>([]);

  const handleSubmit = async () => {
    const submissionData = {
      ...data,
      trackId: data.trackId === "" ? null : data.trackId
    };
    await onSubmit(submissionData);
  };

  useEffect(() => {
    async function loadTracks() {
      const { data, error } = await api.admin.hackathons.tracks.get({
        query: { hackathonId }
      });
      if (!error && data) {
        setTracks(data.map((t) => ({ _id: t._id.toString(), name: t.name })));
      }
    }
    loadTracks();
  }, [hackathonId]);

  return (
    <Form>
      <TextField
        label={t("name")}
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        fullWidth
        required
      />

      <TextField
        select
        label={t("track")}
        value={data.trackId}
        onChange={(e) => setData({ ...data, trackId: e.target.value })}
        fullWidth
      >
        <MenuItem value="">
          <em>{t("noTrack")}</em>
        </MenuItem>
        {tracks.map((track) => (
          <MenuItem key={track._id} value={track._id}>
            {track.name}
          </MenuItem>
        ))}
        {tracks.length === 0 && (
          <MenuItem disabled value="">
            {t("noTracksAvailable")}
          </MenuItem>
        )}
      </TextField>

      <TextField
        label={t("projectDescription")}
        value={data.projectDescription}
        onChange={(e) => setData({ ...data, projectDescription: e.target.value })}
        fullWidth
        multiline
        rows={3}
      />

      <TeamUserSelector
        label={t("users")}
        value={data.users}
        onChange={(users) => setData({ ...data, users })}
      />

      <Actions>
        <SaveButton onClick={handleSubmit}>{t("save")}</SaveButton>
        {onCancel && <CancelButton onClick={onCancel}>{t("cancel")}</CancelButton>}
      </Actions>
    </Form>
  );
}

export default TeamForm;
