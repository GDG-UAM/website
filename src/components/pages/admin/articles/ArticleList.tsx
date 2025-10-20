"use client";

import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  AddButton,
  EditButton,
  ViewButton,
  ReloadButton,
  DeleteButton
} from "@/components/Buttons";
import { TextField, Checkbox, Chip } from "@mui/material";
import { useTranslations } from "next-intl";
import { IArticle, ArticleStatus } from "@/lib/models/Article";
import { newErrorToast, newInfoToast } from "@/components/Toast";

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
  padding: 12px;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
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

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 0;
  font-size: 16px;
`;

const TitleCell = styled.div`
  font-weight: 600;
`;

const SlugCell = styled.div`
  color: #6b7280;
  font-size: 12px;
`;

const RowActions = styled.div`
  display: flex;
  gap: 6px;
`;

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
  const [rows, setRows] = useState<IArticle[]>([]);
  const [search, setSearch] = useState("");
  const [includeContentInSearch, setIncludeContentInSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/admin/articles?q=${encodeURIComponent(search)}&page=1&pageSize=50&type=${type}&includeContentInSearch=${includeContentInSearch}`
        );
        const data = await res.json();
        setRows(
          (data || []).map((x: IArticle) => ({
            _id: x._id,
            type: x.type,
            title: x.title as unknown as string,
            slug: x.slug,
            status: x.status,
            views: x.views,
            createdAt: x.createdAt,
            publishedAt: x.publishedAt
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
    [search, type, includeContentInSearch]
  );

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  return (
    <Wrapper>
      <Controls>
        <AddButton onClick={onCreate}>{t("create")}</AddButton>
        <ReloadButton onClick={() => load(true)}>{t("reload")}</ReloadButton>
        <CheckboxWrapper>
          <Checkbox
            checked={includeContentInSearch}
            onChange={(e) => setIncludeContentInSearch(e.target.checked)}
          />
          {t("includeContent")}
        </CheckboxWrapper>
        <TextField
          size="small"
          placeholder={t("search", { type })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: "auto", minWidth: "250px" }}
        />
      </Controls>

      <Card>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>{t("loading")}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            {search ? t("noResults") : t("noArticles")}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>{t("columns.title")}</th>
                <th>{t("columns.status")}</th>
                <th>{t("columns.views")}</th>
                <th>{t("columns.published")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id.toString()}>
                  <td>
                    <TitleCell>{r.title || ""}</TitleCell>
                    <SlugCell>{r.slug}</SlugCell>
                  </td>
                  <td>
                    {(() => {
                      const key: ArticleStatus =
                        r.status === "draft" || r.status === "published" || r.status === "url_only"
                          ? (r.status as ArticleStatus)
                          : "draft";
                      const colors = {
                        draft: "warning",
                        published: "success",
                        url_only: "secondary"
                      } as const;
                      return (
                        <Chip
                          size="small"
                          variant="outlined"
                          color={colors[key]}
                          label={t(`status.${key}`)}
                        />
                      );
                    })()}
                  </td>
                  <td>{r.views}</td>
                  <td>{r.publishedAt ? new Date(r.publishedAt).toLocaleString() : "—"}</td>
                  <td>
                    <RowActions>
                      <ViewButton onClick={() => onView(r._id.toString(), r.type)} iconSize={20} />
                      <EditButton onClick={() => onEdit(r._id.toString())} iconSize={20} />
                      <DeleteButton
                        onClick={() => onDelete(r._id.toString())}
                        confirmationDuration={3000}
                        iconSize={20}
                      />
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {!loading && rows.length > 0 && (
        <div style={{ fontSize: "0.875rem", color: "#666" }}>
          {t("showing", { count: rows.length })}
        </div>
      )}
    </Wrapper>
  );
}

export default ArticleList;
