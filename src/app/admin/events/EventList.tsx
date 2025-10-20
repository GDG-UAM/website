"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  AddButton,
  EditButton,
  ViewButton,
  ReloadButton,
  DeleteButton,
  AcceptButton,
  HideButton
} from "@/components/Buttons";
import { useRouter } from "next/navigation";
import { Chip, TextField, MenuItem } from "@mui/material";
import { useTranslations } from "next-intl";
import LocalTime from "@/components/LocalTime";
import { newErrorToast, newInfoToast, newSuccessToast } from "@/components/Toast";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
  padding: 12px;
`;

// Contenedor con bordes redondeados para la tabla (vista Lista)
const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px; /* más redondeado para apariencia armoniosa */
  overflow: hidden; /* recorta los bordes de la tabla para respetar el radio */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 10px 6px;
    border-bottom: 1px solid #f3f4f6;
  }
  th {
    text-align: left;
    border-bottom-width: 2px;
  }
`;

type EventRow = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  date: string;
};

type StatusFilter = "all" | "published" | "draft";
type DateFilter = "all" | "upcoming" | "past";
type SortOption = "date-newest" | "date-oldest" | "title-az" | "title-za";

export function EventList({
  onCreate,
  onEdit,
  onView,
  onDelete,
  refreshToken
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
  onView: (slug: string) => void;
  onDelete: (id: string) => void;
  refreshToken?: number;
}) {
  const t = useTranslations("admin.events.list");
  const router = useRouter();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("date-newest");
  const [loading, setLoading] = useState(true);

  // Load events from the API, just one render
  const load = useCallback(async (notify?: boolean) => {
    try {
      setLoading(true);
      // Fetch both published and draft to show everything in admin without changing the API
      const [pubRes, draftRes] = await Promise.all([
        fetch(`/api/admin/events?status=published&sort=newest&page=1&pageSize=200`, {
          cache: "no-store"
        }),
        fetch(`/api/admin/events?status=draft&sort=newest&page=1&pageSize=200`, {
          cache: "no-store"
        })
      ]);

      const [pubData, draftData] = await Promise.all([pubRes.json(), draftRes.json()]);

      const items = [...(pubData.items || []), ...(draftData.items || [])] as EventRow[];
      setRows(items);
      if (notify) {
        newInfoToast("List reloaded");
      }
    } catch (e) {
      console.error("Failed to load events:", e);
      setRows([]);
      newErrorToast("Couldn't load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  // Client-side filtering and sorting for flexible UI
  const filteredRows = useMemo(() => {
    const now = Date.now();
    let list = rows;

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      list = list.filter((r) => {
        const t = new Date(r.date).getTime();
        return dateFilter === "upcoming" ? t >= now : t < now;
      });
    }

    // Search filter (title or slug)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sorted = [...list];
    switch (sort) {
      case "date-oldest":
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "title-az":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-za":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "date-newest":
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }
    return sorted;
  }, [rows, statusFilter, dateFilter, search, sort]);

  const toggleStatus = useCallback(
    async (id: string, next: "draft" | "published") => {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) {
        console.error("Failed to toggle status", res.status);
        newErrorToast(t("toasts.toggleError", { defaultValue: "Couldn't update status" }));
      }
      await load();
      if (res.ok) {
        if (next === "published") {
          newSuccessToast(t("toasts.publishSuccess", { defaultValue: "Event published" }));
        } else {
          newSuccessToast(t("toasts.unpublishSuccess", { defaultValue: "Event unpublished" }));
        }
      }
    },
    [load, t]
  );

  return (
    <Wrapper>
      <Controls>
        <AddButton onClick={() => onCreate()}>{t("create")}</AddButton>
        <ReloadButton onClick={() => load(true)}>{t("reload")}</ReloadButton>
        <TextField
          size="small"
          select
          label={t("filters.status", { defaultValue: "Status" })}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          style={{ minWidth: 120 }}
        >
          <MenuItem value="all">{t("filters.all", { defaultValue: "All" })}</MenuItem>
          <MenuItem value="published">
            {t("status.published", { defaultValue: "Published" })}
          </MenuItem>
          <MenuItem value="draft">{t("status.draft", { defaultValue: "Draft" })}</MenuItem>
        </TextField>
        <TextField
          size="small"
          select
          label={t("filters.date", { defaultValue: "Date" })}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          style={{ minWidth: 120 }}
        >
          <MenuItem value="all">{t("filters.all", { defaultValue: "All" })}</MenuItem>
          <MenuItem value="upcoming">
            {t("filters.upcoming", { defaultValue: "Upcoming" })}
          </MenuItem>
          <MenuItem value="past">{t("filters.past", { defaultValue: "Past" })}</MenuItem>
        </TextField>
        <TextField
          size="small"
          select
          label={t("filters.sort", { defaultValue: "Sort" })}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{ minWidth: 160 }}
        >
          <MenuItem value="date-newest">
            {t("filters.dateNewest", { defaultValue: "Date: Newest" })}
          </MenuItem>
          <MenuItem value="date-oldest">
            {t("filters.dateOldest", { defaultValue: "Date: Oldest" })}
          </MenuItem>
          <MenuItem value="title-az">
            {t("filters.titleAZ", { defaultValue: "Title A-Z" })}
          </MenuItem>
          <MenuItem value="title-za">
            {t("filters.titleZA", { defaultValue: "Title Z-A" })}
          </MenuItem>
        </TextField>
        <TextField
          size="small"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: "auto", minWidth: "250px" }}
        />
      </Controls>

      <Card>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>{t("loading")}</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            {search || statusFilter !== "all" || dateFilter !== "all"
              ? t("noResults")
              : t("noEvents")}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>{t("columns.title")}</th>
                <th>{t("columns.date")}</th>
                <th>{t("columns.status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>/{r.slug}</div>
                  </td>
                  <td>
                    <LocalTime iso={r.date} dateOnly={false} />
                  </td>
                  <td>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={r.status === "published" ? "success" : "warning"}
                      label={t(`status.${r.status}`)}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {/* View action (public or admin detail) */}
                      <ViewButton
                        onClick={() =>
                          onView ? onView(r.slug) : router.push(`/admin/events/${r.slug}`)
                        }
                        iconSize={20}
                      />
                      {r.status === "draft" ? (
                        <AcceptButton
                          ariaLabel={t("actions.publish", { defaultValue: "Publicar" })}
                          onClick={() => toggleStatus(r._id, "published")}
                          iconSize={20}
                          confirmationDuration={1000}
                        />
                      ) : (
                        <HideButton
                          ariaLabel={t("actions.unpublish", { defaultValue: "Despublicar" })}
                          onClick={() => toggleStatus(r._id, "draft")}
                          iconSize={20}
                          confirmationDuration={1000}
                        />
                      )}
                      <EditButton onClick={() => onEdit(r._id)} iconSize={20} />
                      <DeleteButton
                        onClick={() => onDelete(r._id)}
                        confirmationDuration={3000}
                        iconSize={20}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {!loading && filteredRows.length > 0 && (
        <div style={{ fontSize: "0.875rem", color: "#666" }}>
          {t("showing", { count: filteredRows.length })}
        </div>
      )}
    </Wrapper>
  );
}
