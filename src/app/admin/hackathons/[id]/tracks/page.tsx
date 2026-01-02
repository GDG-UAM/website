"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { BackButton } from "@/components/Buttons";
import { newErrorToast, newInfoToast } from "@/components/Toast";
import TrackList from "@/components/pages/admin/hackathons/TrackList";
import { api } from "@/lib/eden";
import { getCsrfToken } from "@/lib/security/csrfClient";
import TrackForm, { TrackFormData } from "@/components/pages/admin/hackathons/TrackForm";

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

interface HackathonInfo {
  _id: string;
  title: string;
}

export default function HackathonTracksPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admin.hackathons");
  const tTracks = useTranslations("admin.hackathons.tracks");
  const tNav = useTranslations("admin.breadcrumbs");
  const id = params?.id as string;

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [hackathon, setHackathon] = useState<HackathonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialData, setInitialData] = useState<TrackFormData>({
    name: "",
    judges: [],
    rubrics: []
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const res = await fetch(`/api/admin/hackathons/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHackathon(data);
      } catch {
        newErrorToast(t("toasts.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchHackathon();
  }, [id, t]);

  const handleCreate = () => {
    setMode("create");
    setInitialData({
      name: "",
      judges: [],
      rubrics: []
    });
  };

  const handleEdit = async (trackId: string) => {
    setEditingTrackId(trackId);
    setMode("edit");
    setFormLoading(true);
    try {
      const { data, error } = await api.admin.hackathons.tracks({ trackId }).get();
      if (error) throw error;
      setInitialData({
        name: data.name,
        judges: data.judges || [],
        rubrics: data.rubrics || []
      });
    } catch {
      newErrorToast(t("toasts.loadError"));
      setMode("list");
    } finally {
      setFormLoading(false);
    }
  };

  const goList = () => {
    setMode("list");
    setEditingTrackId(null);
    setInitialData({
      name: "",
      judges: [],
      rubrics: []
    });
    setRefreshKey((k) => k + 1);
  };

  const handleSave = async (data: TrackFormData) => {
    try {
      const token = await getCsrfToken();
      if (mode === "edit" && editingTrackId) {
        const { error } = await api.admin.hackathons
          .tracks({ trackId: editingTrackId })
          .patch(data, {
            headers: { "x-csrf-token": token || "" }
          });
        if (error) throw error;
        newInfoToast(tTracks("toasts.updated"));
      } else {
        const { error } = await api.admin.hackathons.tracks.post(data, {
          query: { hackathonId: id },
          headers: { "x-csrf-token": token || "" }
        });
        if (error) throw error;
        newInfoToast(tTracks("toasts.created"));
      }
      goList();
    } catch {
      newErrorToast(tTracks("toasts.saveError"));
    }
  };

  const handleDelete = async (trackId: string) => {
    try {
      const token = await getCsrfToken();
      const { error } = await api.admin.hackathons.tracks({ trackId }).delete(null, {
        headers: { "x-csrf-token": token || "" }
      });
      if (error) throw error;
      newInfoToast(tTracks("toasts.deleted"));
      setRefreshKey((k) => k + 1);
    } catch {
      newErrorToast(tTracks("toasts.deleteError"));
    }
  };

  if (loading) return null;

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tNav("admin"), href: "/admin" },
          { label: tNav("hackathons"), href: "/admin/hackathons" },
          { label: hackathon?.title || "...", href: `/admin/hackathons/${id}` },
          { label: t("dashboard.tracks"), href: `/admin/hackathons/${id}/tracks` },
          ...(mode === "create" ? [{ label: tTracks("form.createTitle"), href: "#" }] : []),
          ...(mode === "edit" ? [{ label: tTracks("form.editTitle"), href: "#" }] : [])
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && t("dashboard.tracks")}
          {mode === "create" && tTracks("form.createTitle")}
          {mode === "edit" && tTracks("form.editTitle")}
        </Title>
      </Header>

      <div style={{ marginBottom: "20px" }}>
        <BackButton
          onClick={mode === "list" ? () => router.push(`/admin/hackathons/${id}`) : goList}
        >
          {t("form.backToList")}
        </BackButton>
      </div>

      {mode === "list" ? (
        <TrackList
          hackathonId={id}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          refreshToken={refreshKey}
        />
      ) : formLoading ? (
        <div>Loading...</div>
      ) : (
        <TrackForm initial={initialData} onCancel={goList} onSubmit={handleSave} />
      )}
    </Container>
  );
}
