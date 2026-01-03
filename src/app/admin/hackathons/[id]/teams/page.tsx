"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { BackButton } from "@/components/Buttons";
import { newErrorToast, newInfoToast } from "@/components/Toast";
import TeamList from "@/components/pages/admin/hackathons/TeamList";
import { api } from "@/lib/eden";
import { getCsrfToken } from "@/lib/security/csrfClient";
import TeamForm, { TeamFormData } from "@/components/pages/admin/hackathons/TeamForm";

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

export default function HackathonTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admin.hackathons");
  const tTeams = useTranslations("admin.hackathons.teams");
  const tNav = useTranslations("admin.breadcrumbs");
  const id = params?.id as string;

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [hackathon, setHackathon] = useState<HackathonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialData, setInitialData] = useState<TeamFormData>({
    name: "",
    projectDescription: "",
    users: []
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
      projectDescription: "",
      users: []
    });
  };

  const handleEdit = async (teamId: string) => {
    setEditingTeamId(teamId);
    setMode("edit");
    setFormLoading(true);
    try {
      const { data, error } = await api.admin.hackathons.teams({ teamId }).get();
      if (error) throw error;
      setInitialData({
        name: data.name,
        trackId:
          data.trackId && typeof data.trackId === "object"
            ? data.trackId._id.toString()
            : data.trackId || "",
        projectDescription: data.projectDescription,
        users: data.users
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
    setEditingTeamId(null);
    setInitialData({
      name: "",
      projectDescription: "",
      users: []
    });
    setRefreshKey((k) => k + 1);
  };

  const handleSave = async (data: TeamFormData) => {
    try {
      const token = await getCsrfToken();
      if (mode === "edit" && editingTeamId) {
        const { error } = await api.admin.hackathons.teams({ teamId: editingTeamId }).patch(data, {
          headers: { "x-csrf-token": token || "" }
        });
        if (error) throw error;
        newInfoToast(tTeams("toasts.updated"));
      } else {
        const { error } = await api.admin.hackathons.teams.post(data, {
          query: { hackathonId: id },
          headers: { "x-csrf-token": token || "" }
        });
        if (error) throw error;
        newInfoToast(tTeams("toasts.created"));
      }
      goList();
    } catch {
      newErrorToast(tTeams("toasts.saveError"));
    }
  };

  const handleDelete = async (teamId: string) => {
    try {
      const token = await getCsrfToken();
      const { error } = await api.admin.hackathons.teams({ teamId }).delete(null, {
        headers: { "x-csrf-token": token || "" }
      });
      if (error) throw error;
      newInfoToast(tTeams("toasts.deleted"));
      setRefreshKey((k) => k + 1);
    } catch {
      newErrorToast(tTeams("toasts.deleteError"));
    }
  };

  const handleManageCertificates = (teamId: string) => {
    router.push(`/admin/hackathons/${id}/teams/${teamId}/certificates`);
  };

  if (loading) return null;

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tNav("admin"), href: "/admin" },
          { label: tNav("hackathons"), href: "/admin/hackathons" },
          { label: hackathon?.title || "...", href: `/admin/hackathons/${id}` },
          { label: t("dashboard.teams"), href: `/admin/hackathons/${id}/teams` },
          ...(mode === "create" ? [{ label: tTeams("form.createTitle"), href: "#" }] : []),
          ...(mode === "edit" ? [{ label: tTeams("form.editTitle"), href: "#" }] : [])
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && t("dashboard.teams")}
          {mode === "create" && tTeams("form.createTitle")}
          {mode === "edit" && tTeams("form.editTitle")}
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
        <TeamList
          hackathonId={id}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onManageCertificates={handleManageCertificates}
          refreshToken={refreshKey}
        />
      ) : formLoading ? (
        <div>Loading...</div>
      ) : (
        <TeamForm hackathonId={id} initial={initialData} onCancel={goList} onSubmit={handleSave} />
      )}
    </Container>
  );
}
