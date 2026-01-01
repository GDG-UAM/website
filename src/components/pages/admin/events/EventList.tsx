"use client";
import { api } from "@/lib/eden";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AddButton,
  EditButton,
  ViewButton,
  DeleteButton,
  AcceptButton,
  HideButton
} from "@/components/Buttons";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LocalTime from "@/components/LocalTime";
import { newErrorToast, newInfoToast, newSuccessToast } from "@/components/Toast";
import { getCsrfToken } from "@/lib/security/csrfClient";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "@/components/admin/AdminTableFactories";

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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Load events from the API, just one render
  const load = useCallback(async (notify?: boolean) => {
    try {
      setLoading(true);
      // Fetch both published and draft to show everything in admin without changing the API
      const [pubRes, draftRes] = await Promise.all([
        api.admin.events.get({
          query: { status: "published", sort: "newest", page: 1, pageSize: 100 }
        }),
        api.admin.events.get({
          query: { status: "draft", sort: "newest", page: 1, pageSize: 100 }
        })
      ]);

      if (pubRes.error || draftRes.error) throw new Error("Failed to load events");

      const pubItems = pubRes.data?.items || [];
      const draftItems = draftRes.data?.items || [];

      const items = [...pubItems, ...draftItems] as unknown as EventRow[];
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
  const allFilteredRows = useMemo(() => {
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

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, search, sort]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allFilteredRows.slice(start, start + PAGE_SIZE);
  }, [allFilteredRows, page]);

  const toggleStatus = useCallback(
    async (id: string, next: "draft" | "published") => {
      const csrfToken = await getCsrfToken();
      const { error } = await api.admin
        .events({ id })
        .patch({ status: next }, { headers: { "x-csrf-token": csrfToken || "" } });

      if (error) {
        console.error("Failed to toggle status", error);
        newErrorToast(t("toasts.toggleError", { defaultValue: "Couldn't update status" }));
      }
      await load();
      if (!error) {
        if (next === "published") {
          newSuccessToast(t("toasts.publishSuccess", { defaultValue: "Event published" }));
        } else {
          newSuccessToast(t("toasts.unpublishSuccess", { defaultValue: "Event unpublished" }));
        }
      }
    },
    [load, t]
  );

  const columns = useMemo(
    () => [
      textColumn<EventRow>("title", t("columns.title"), (r) => r.title, {
        bold: true,
        subValue: (r) => `/${r.slug}`
      }),
      customColumn<EventRow>("date", t("columns.date"), (r) => (
        <LocalTime iso={r.date} dateOnly={false} />
      )),
      chipColumn<EventRow, "published" | "draft">(
        "status",
        t("columns.status"),
        (r) => r.status,
        (status) => t(`status.${status}`),
        (status) => (status === "published" ? "success" : "warning")
      )
    ],
    [t]
  );

  return (
    <AdminTable
      columns={columns}
      data={pagedRows}
      loading={loading}
      onReload={() => load(true)}
      reloadLabel={t("reload")}
      headerActions={<AddButton onClick={() => onCreate()}>{t("create")}</AddButton>}
      rowActions={(r) => (
        <>
          <ViewButton
            onClick={() => (onView ? onView(r.slug) : router.push(`/admin/events/${r.slug}`))}
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
          <DeleteButton onClick={() => onDelete(r._id)} confirmationDuration={3000} iconSize={20} />
        </>
      )}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t("search")
      }}
      filters={[
        {
          key: "status",
          label: t("filters.status", { defaultValue: "Status" }),
          value: statusFilter,
          onChange: (v) => setStatusFilter(v as StatusFilter),
          options: [
            { label: t("filters.all", { defaultValue: "All" }), value: "all" },
            { label: t("status.published", { defaultValue: "Published" }), value: "published" },
            { label: t("status.draft", { defaultValue: "Draft" }), value: "draft" }
          ]
        },
        {
          key: "date",
          label: t("filters.date", { defaultValue: "Date" }),
          value: dateFilter,
          onChange: (v) => setDateFilter(v as DateFilter),
          options: [
            { label: t("filters.all", { defaultValue: "All" }), value: "all" },
            { label: t("filters.upcoming", { defaultValue: "Upcoming" }), value: "upcoming" },
            { label: t("filters.past", { defaultValue: "Past" }), value: "past" }
          ]
        },
        {
          key: "sort",
          label: t("filters.sort", { defaultValue: "Sort" }),
          value: sort,
          onChange: (v) => setSort(v as SortOption),
          options: [
            {
              label: t("filters.dateNewest", { defaultValue: "Date: Newest" }),
              value: "date-newest"
            },
            {
              label: t("filters.dateOldest", { defaultValue: "Date: Oldest" }),
              value: "date-oldest"
            },
            { label: t("filters.titleAZ", { defaultValue: "Title A-Z" }), value: "title-az" },
            { label: t("filters.titleZA", { defaultValue: "Title Z-A" }), value: "title-za" }
          ],
          minWidth: "160px"
        }
      ]}
      emptyMessage={t("noEvents")}
      noResultsMessage={t("noResults")}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total: allFilteredRows.length,
        onPageChange: setPage
      }}
    />
  );
}
