"use client";
import { api } from "@/lib/eden";

import { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { AddButton, EditButton, DeleteButton, CopyButton } from "@/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "@/components/Toast";
import { useTranslations } from "next-intl";
import { getCsrfToken } from "@/lib/security/csrfClient";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "@/components/admin/AdminTableFactories";

const LinkDestination = styled.a`
  color: #0066cc;
  text-decoration: none;
  font-size: 0.9rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;

  &:hover {
    text-decoration: underline;
  }
`;

type LinkRow = {
  _id: string;
  slug: string;
  destination: string;
  title: string;
  description?: string;
  isActive: boolean;
  clicks: number;
};

export function LinkList({
  onCreate,
  onEdit,
  refreshToken
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
  refreshToken?: number;
}) {
  const t = useTranslations("admin.links.list");
  const tToasts = useTranslations("admin.links.list.toasts");
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 100;

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const { data, error } = await api.admin.links.get({
          query: {
            search: search || undefined,
            page,
            pageSize: PAGE_SIZE
          }
        });

        if (!error && data) {
          setRows(data.items || []);
          setTotal(data.total);
          if (notify) {
            newInfoToast(tToasts("reloaded"));
          }
        } else {
          throw new Error("Failed to load links");
        }
      } catch (e) {
        console.error("Failed to load links:", e);
        setRows([]);
        newErrorToast(tToasts("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [tToasts, search, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const filteredRows = useMemo(() => {
    // If we have search, the API already filtered it for us in this case
    // But since LinkList was doing client-side before, I should keep it consistent if needed.
    // Actually, LinkList API does support 'q' search.
    // So let's rely on server side.
    return rows;
  }, [rows]);

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(t("deleteConfirm", { slug }))) return;

    try {
      const token = await getCsrfToken();
      const headers = { "x-csrf-token": token || "" };
      const { error } = await api.admin.links({ id }).delete(null, { headers });

      if (!error) {
        newSuccessToast(tToasts("deleteSuccess"));
        load();
      } else {
        throw new Error("Failed to delete link");
      }
    } catch (e) {
      console.error("Delete error:", e);
      newErrorToast(e instanceof Error ? e.message : tToasts("deleteError"));
    }
  };

  const columns = useMemo(
    () => [
      textColumn<LinkRow>("slug", t("columns.slug"), (r) => `/${r.slug}`, {
        bold: true
      }),
      textColumn<LinkRow>("title", t("columns.title"), (r) => r.title, {
        bold: true,
        subValue: (r) => r.description
      }),
      customColumn<LinkRow>("destination", t("columns.destination"), (r) => (
        <LinkDestination href={r.destination} target="_blank" rel="noopener">
          {r.destination}
        </LinkDestination>
      )),
      chipColumn<LinkRow, "active" | "inactive">(
        "status",
        t("columns.status"),
        (r) => (r.isActive ? "active" : "inactive"),
        (status) => t(`status.${status}`),
        (status) => (status === "active" ? "success" : "default")
      ),
      textColumn<LinkRow>("clicks", t("columns.clicks"), (r) => r.clicks.toLocaleString())
    ],
    [t]
  );

  return (
    <AdminTable
      columns={columns}
      data={filteredRows}
      loading={loading}
      onReload={() => load(true)}
      reloadLabel={t("reload")}
      headerActions={<AddButton onClick={onCreate}>{t("create")}</AddButton>}
      rowActions={(row) => (
        <>
          <CopyButton
            content={`${typeof window !== "undefined" ? window.location.origin : ""}/link/${row.slug}`}
            ariaLabel="Copy link URL"
            iconSize={20}
          />
          <EditButton onClick={() => onEdit(row._id)} ariaLabel="Edit link" iconSize={20} />
          <DeleteButton
            onClick={() => handleDelete(row._id, row.slug)}
            ariaLabel="Delete link"
            iconSize={20}
          />
        </>
      )}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t("search")
      }}
      emptyMessage={t("noLinks")}
      noResultsMessage={t("noResults")}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total,
        onPageChange: setPage
      }}
    />
  );
}
