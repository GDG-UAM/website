"use client";
import { api } from "@/lib/eden";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AddButton,
  EditButton,
  DeleteButton,
  CopyButton,
  CertificateButton
} from "@/components/Buttons";
import { useTranslations } from "next-intl";
import { newErrorToast, newInfoToast } from "@/components/Toast";
import { AdminTable } from "@/components/admin/AdminTable";
import { customColumn, textColumn } from "@/components/admin/AdminTableFactories";
import UserMention from "@/components/markdown/components/UserMention";

interface TeamInterface {
  _id: string;
  name: string;
  trackId?: { _id: string; name: string } | string;
  projectDescription?: string;
  password: string;
  users: { id: string; name: string }[];
  certificateCount?: number;
}

function TeamList({
  hackathonId,
  onCreate,
  onEdit,
  onDelete,
  onManageCertificates,
  refreshToken
}: {
  hackathonId: string;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onManageCertificates: (id: string) => void;
  refreshToken?: number;
}) {
  const t = useTranslations("admin.hackathons.teams");
  const [rows, setRows] = useState<TeamInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const { data, error } = await api.admin.hackathons.teams.get({
          query: { hackathonId }
        });
        if (error) throw error;
        setRows(
          data.items.map((x) => ({
            ...x,
            _id: x._id.toString(),
            trackId:
              x.trackId && typeof x.trackId === "object"
                ? { ...x.trackId, _id: x.trackId._id.toString() }
                : x.trackId
          }))
        );
        if (notify) {
          newInfoToast("List reloaded");
        }
      } catch (e) {
        console.error("Failed to load teams:", e);
        setRows([]);
        newErrorToast("Couldn't load teams");
      } finally {
        setLoading(false);
      }
    },
    [hackathonId]
  );

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const columns = useMemo(
    () => [
      textColumn<TeamInterface>("name", t("columns.name"), (r) => r.name, {
        bold: true
      }),
      textColumn<TeamInterface>("track", t("columns.track"), (r) =>
        r.trackId && typeof r.trackId === "object" ? r.trackId.name : r.trackId
      ),
      textColumn<TeamInterface>(
        "projectDescription",
        t("columns.projectDescription"),
        (r) => r.projectDescription
      ),
      customColumn<TeamInterface>("users", t("columns.users"), (r) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {r.users.map((u, i) => {
            const isId = /^[0-9a-fA-F]{24}$/.test(u.id);
            return (
              <span key={i}>
                {isId ? <UserMention userId={u.id} isAdmin /> : u.name}
                {i < r.users.length - 1 && ", "}
              </span>
            );
          })}
        </div>
      )),
      customColumn<TeamInterface>("password", t("columns.password"), (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <code>{r.password}</code>
          <CopyButton content={r.password} iconSize={20} />
        </div>
      ))
    ],
    [t]
  );

  return (
    <AdminTable
      columns={columns}
      data={rows}
      loading={loading}
      onReload={() => load(true)}
      reloadLabel={t("reload")}
      headerActions={<AddButton onClick={onCreate}>{t("create")}</AddButton>}
      rowActions={(r) => (
        <>
          <CertificateButton
            onClick={() => onManageCertificates(r._id)}
            iconSize={20}
            ariaLabel={t("emitCertificates")}
          >
            {r.certificateCount !== undefined && r.certificateCount > 0 && (
              <span style={{ fontSize: "0.75rem", fontWeight: "bold", marginLeft: "4px" }}>
                {r.certificateCount}
              </span>
            )}
          </CertificateButton>
          <EditButton onClick={() => onEdit(r._id)} iconSize={20} />
          <DeleteButton onClick={() => onDelete(r._id)} confirmationDuration={3000} iconSize={20} />
        </>
      )}
      emptyMessage={t("noTeams")}
      noResultsMessage={t("noResults")}
    />
  );
}

export default TeamList;
