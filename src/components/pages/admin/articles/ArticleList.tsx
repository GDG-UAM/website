"use client";
import { api } from "@/lib/eden";

import { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { AddButton, EditButton, ViewButton, DeleteButton } from "@/components/Buttons";
import { Checkbox } from "@mui/material";
import { useTranslations } from "next-intl";
import { ArticleStatus } from "@/lib/models/Article";
import { newErrorToast, newInfoToast } from "@/components/Toast";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, chipColumn, dateColumn } from "@/components/admin/AdminTableFactories";

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 0;
  font-size: 16px;
`;

interface ArticleInterface {
  _id: string;
  type: "blog" | "newsletter";
  title: string;
  slug: string;
  status: ArticleStatus;
  views: number;
  createdAt: Date;
  publishedAt: Date;
}

function ArticleList({
  onCreate,
  onEdit,
  onView,
  onDelete,
  type,
  refreshToken
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
  onView: (id: string, type?: "blog" | "newsletter") => void;
  onDelete: (id: string) => void;
  type: "blog" | "newsletter";
  refreshToken?: number;
}) {
  const t = useTranslations("admin.articles.list");
  const [rows, setRows] = useState<ArticleInterface[]>([]);
  const [search, setSearch] = useState("");
  const [includeContentInSearch, setIncludeContentInSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const { data, error } = await api.admin.articles.get({
          query: {
            q: encodeURIComponent(search),
            page,
            pageSize: PAGE_SIZE,
            type,
            includeContentInSearch: includeContentInSearch.toString()
          }
        });
        if (error) throw error;
        setTotal(data.total);
        setRows(
          data.items.map((x) => ({
            _id: x._id,
            type: x.type,
            title: x.title,
            slug: x.slug,
            status: x.status,
            views: x.views,
            createdAt: new Date(x.createdAt),
            publishedAt: new Date(x.publishedAt || "")
          }))
        );
        if (notify) {
          newInfoToast("List reloaded");
        }
      } catch (e) {
        console.error("Failed to load articles:", e);
        setRows([]);
        newErrorToast("Couldn't load articles");
      } finally {
        setLoading(false);
      }
    },
    [search, type, includeContentInSearch, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, type, includeContentInSearch]);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const columns = useMemo(
    () => [
      textColumn<ArticleInterface>("title", t("columns.title"), (r) => r.title || "", {
        bold: true,
        subValue: (r) => r.slug
      }),
      chipColumn<ArticleInterface, ArticleStatus>(
        "status",
        t("columns.status"),
        (r) => {
          if (r.status === "draft" || r.status === "published" || r.status === "url_only") {
            return r.status as ArticleStatus;
          }
          return "draft";
        },
        (status) => t(`status.${status}`),
        (status) => {
          const colors = {
            draft: "warning",
            published: "success",
            url_only: "secondary"
          } as const;
          return colors[status];
        }
      ),
      textColumn<ArticleInterface>("views", t("columns.views"), (r) => r.views),
      dateColumn<ArticleInterface>("publishedAt", t("columns.published"), (r) => r.publishedAt, {
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
      headerActions={
        <>
          <AddButton onClick={onCreate}>{t("create")}</AddButton>
          <CheckboxWrapper>
            <Checkbox
              checked={includeContentInSearch}
              onChange={(e) => setIncludeContentInSearch(e.target.checked)}
            />
            {t("includeContent")}
          </CheckboxWrapper>
        </>
      }
      rowActions={(r) => (
        <>
          <ViewButton onClick={() => onView(r._id.toString(), r.type)} iconSize={20} />
          <EditButton onClick={() => onEdit(r._id.toString())} iconSize={20} />
          <DeleteButton
            onClick={() => onDelete(r._id.toString())}
            confirmationDuration={3000}
            iconSize={20}
          />
        </>
      )}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t("search", { type })
      }}
      emptyMessage={t("noArticles")}
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

export default ArticleList;
