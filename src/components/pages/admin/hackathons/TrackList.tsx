"use client";
import { api } from "@/lib/eden";
import { useEffect, useState, useCallback, useMemo } from "react";
import { AddButton, EditButton, DeleteButton } from "@/components/Buttons";
import { useTranslations } from "next-intl";
import { newErrorToast, newInfoToast } from "@/components/Toast";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, dateColumn, customColumn } from "@/components/admin/AdminTableFactories";
import UserMention from "@/components/markdown/components/UserMention";

interface TrackInterface {
  _id: string;
  name: string;
  judges: string[];
  createdAt: Date;
}

function TrackList({
  hackathonId,
  onCreate,
  onEdit,
  onDelete,
  refreshToken
}: {
  hackathonId: string;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  refreshToken?: number;
}) {
  const t = useTranslations("admin.hackathons.tracks");
  const [rows, setRows] = useState<TrackInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const { data, error } = await api.admin.hackathons.tracks.get({
          query: { hackathonId }
        });
        if (error) throw error;
        setRows(
          data.map((x) => ({
            _id: x._id.toString(),
            name: x.name,
            judges: x.judges || [],
            createdAt: new Date(x.createdAt)
          }))
        );
        if (notify) {
          newInfoToast("List reloaded");
        }
      } catch (e) {
        console.error("Failed to load tracks:", e);
        setRows([]);
        newErrorToast("Couldn't load tracks");
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
      textColumn<TrackInterface>("name", t("columns.name"), (r) => r.name, {
        bold: true
      }),
      customColumn<TrackInterface>("judges", t("columns.judges"), (r) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {r.judges.map((u, i) => {
            const isId = /^[0-9a-fA-F]{24}$/.test(u);
            return (
              <span key={i}>
                {isId ? <UserMention userId={u} isAdmin /> : u}
                {i < r.judges.length - 1 && ", "}
              </span>
            );
          })}
        </div>
      )),
      dateColumn<TrackInterface>("createdAt", t("columns.created"), (r) => r.createdAt, {
        includeTime: true
      })
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
          <EditButton onClick={() => onEdit(r._id)} iconSize={20} />
          <DeleteButton onClick={() => onDelete(r._id)} confirmationDuration={3000} iconSize={20} />
        </>
      )}
      emptyMessage={t("noTracks")}
      noResultsMessage={t("noResults")}
    />
  );
}

export default TrackList;
