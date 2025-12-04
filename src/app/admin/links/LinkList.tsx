"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  AddButton,
  EditButton,
  ReloadButton,
  DeleteButton,
  CopyButton
} from "@/components/Buttons";
import { Chip, TextField } from "@mui/material";
import { newErrorToast, newInfoToast, newSuccessToast } from "@/components/Toast";
import { withCsrfHeaders } from "@/lib/security/csrfClient";
import { useTranslations } from "next-intl";

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

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    /* Show scrollbar hint on mobile */
    &::-webkit-scrollbar {
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 0;

  @media (max-width: 900px) {
    /* Allow search field to take full width on smaller screens */
    & > div:last-child {
      flex: 1 1 100%;
      margin-left: 0 !important;
    }
  }

  @media (max-width: 640px) {
    /* Stack all controls vertically on mobile */
    & > * {
      flex: 1 1 100%;
      width: 100%;
      min-width: 100% !important;
      margin-left: 0 !important;
    }
  }
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
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    min-width: 800px; /* Ensure table doesn't collapse on mobile */

    td {
      white-space: nowrap;
    }
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const MonoText = styled.span`
  font-family: monospace;
  font-size: 0.9rem;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
`;

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

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/links?pageSize=100`, {
          cache: "no-store"
        });

        if (res.ok) {
          const data = await res.json();
          setRows(data.items || []);
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
    [tToasts]
  );

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.slug.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(t("deleteConfirm", { slug }))) return;

    try {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: "DELETE",
        headers: await withCsrfHeaders({})
      });

      if (res.ok) {
        newSuccessToast(tToasts("deleteSuccess"));
        load();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete link");
      }
    } catch (e) {
      console.error("Delete error:", e);
      newErrorToast(e instanceof Error ? e.message : tToasts("deleteError"));
    }
  };

  return (
    <Wrapper>
      <Controls>
        <AddButton onClick={onCreate}>{t("create")}</AddButton>
        <ReloadButton onClick={() => load(true)}>{t("reload")}</ReloadButton>
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
            {search ? t("noResults") : t("noLinks")}
          </div>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>{t("columns.slug")}</th>
                  <th>{t("columns.title")}</th>
                  <th>{t("columns.destination")}</th>
                  <th>{t("columns.status")}</th>
                  <th>{t("columns.clicks")}</th>
                  <th>{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <MonoText>/{row.slug}</MonoText>
                    </td>
                    <td>
                      <strong>{row.title}</strong>
                      {row.description && (
                        <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "2px" }}>
                          {row.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <LinkDestination href={row.destination} target="_blank" rel="noopener">
                        {row.destination}
                      </LinkDestination>
                    </td>
                    <td>
                      <Chip
                        label={row.isActive ? t("status.active") : t("status.inactive")}
                        color={row.isActive ? "success" : "default"}
                        size="small"
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>{row.clicks.toLocaleString()}</td>
                    <td>
                      <Actions>
                        <CopyButton
                          content={`${typeof window !== "undefined" ? window.location.origin : ""}/link/${row.slug}`}
                          ariaLabel="Copy link URL"
                          iconSize={20}
                        />
                        <EditButton
                          onClick={() => onEdit(row._id)}
                          ariaLabel="Edit link"
                          iconSize={20}
                        />
                        <DeleteButton
                          onClick={() => handleDelete(row._id, row.slug)}
                          ariaLabel="Delete link"
                          iconSize={20}
                        />
                      </Actions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      {!loading && filteredRows.length > 0 && (
        <div style={{ fontSize: "0.875rem", color: "#666" }}>
          {t("showing", { count: filteredRows.length, total: rows.length })}
        </div>
      )}
    </Wrapper>
  );
}
