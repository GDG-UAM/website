"use client";

import { api } from "@/lib/eden";
import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  AddButton,
  EditButton,
  ViewButton,
  ReloadButton,
  DeleteButton,
  DuplicateButton,
  CancelButton,
  AcceptButton,
  NextButton,
  BackButton
} from "@/components/Buttons";
import { TextField, Chip, MenuItem } from "@mui/material";
import { useTranslations } from "next-intl";
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

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
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
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 0;

  @media (max-width: 900px) {
    & > div:last-child {
      flex: 1 1 100%;
      margin-left: 0 !important;
    }
  }

  @media (max-width: 640px) {
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
    min-width: 800px;

    td {
      white-space: nowrap;
    }
  }
`;

const TitleCell = styled.div`
  font-weight: 600;
`;

const SubCell = styled.div`
  color: #6b7280;
  font-size: 12px;
`;

const RowActions = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

type CertificateType = "COURSE_COMPLETION" | "EVENT_ACHIEVEMENT" | "PARTICIPATION" | "VOLUNTEER";

interface CertificateInterface {
  _id: string;
  publicId: string;
  title: string;
  type: CertificateType;
  recipientName: string;
  revoked: boolean;
  createdAt: Date;
}

type Props = {
  onCreate: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRevoke: (id: string) => void;
  onReinstate: (id: string) => void;
  refreshToken?: number;
};

const typeColors: Record<CertificateType, "primary" | "secondary" | "success" | "warning"> = {
  COURSE_COMPLETION: "primary",
  EVENT_ACHIEVEMENT: "success",
  PARTICIPATION: "secondary",
  VOLUNTEER: "warning"
};

export default function CertificateList({
  onCreate,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onRevoke,
  onReinstate,
  refreshToken
}: Props) {
  const t = useTranslations("admin.certificates.list");
  const [rows, setRows] = useState<CertificateInterface[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CertificateType | "">("");
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const { data, error } = await api.admin.certificates.get({
          query: {
            search: search || undefined,
            type: typeFilter || undefined,
            includeRevoked: includeRevoked.toString(),
            page: page,
            pageSize: PAGE_SIZE
          }
        });
        if (error) throw error;
        setTotal(data.total);
        setRows(
          data.items.map((x) => ({
            _id: x._id as string,
            publicId: x.publicId,
            title: x.title,
            type: x.type as CertificateType,
            recipientName: x.recipient.name,
            revoked: x.revoked?.isRevoked || false,
            createdAt: new Date(x.createdAt)
          }))
        );
        if (notify) {
          newInfoToast(t("reloaded"));
        }
      } catch (e) {
        console.error("Failed to load certificates:", e);
        setRows([]);
        newErrorToast(t("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [search, typeFilter, includeRevoked, page, t]
  );

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  return (
    <Wrapper>
      <Controls>
        <AddButton onClick={onCreate}>{t("create")}</AddButton>
        <ReloadButton onClick={() => load(true)}>{t("reload")}</ReloadButton>
        <TextField
          select
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CertificateType | "")}
          style={{ minWidth: "150px" }}
          label={t("filterType")}
        >
          <MenuItem value="">{t("allTypes")}</MenuItem>
          <MenuItem value="COURSE_COMPLETION">{t("types.courseCompletion")}</MenuItem>
          <MenuItem value="EVENT_ACHIEVEMENT">{t("types.eventAchievement")}</MenuItem>
          <MenuItem value="PARTICIPATION">{t("types.participation")}</MenuItem>
          <MenuItem value="VOLUNTEER">{t("types.volunteer")}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          value={includeRevoked ? "yes" : "no"}
          onChange={(e) => setIncludeRevoked(e.target.value === "yes")}
          style={{ minWidth: "140px" }}
          label={t("showRevoked")}
        >
          <MenuItem value="no">{t("hideRevoked")}</MenuItem>
          <MenuItem value="yes">{t("showRevokedYes")}</MenuItem>
        </TextField>
        <TextField
          size="small"
          placeholder={t("searchPlaceholder")}
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
            {search || typeFilter ? t("noResults") : t("noCertificates")}
          </div>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>{t("columns.title")}</th>
                  <th>{t("columns.recipient")}</th>
                  <th>{t("columns.type")}</th>
                  <th>{t("columns.status")}</th>
                  <th>{t("columns.created")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <TitleCell>{r.title}</TitleCell>
                      <SubCell>{r.publicId}</SubCell>
                    </td>
                    <td>{r.recipientName}</td>
                    <td>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={typeColors[r.type]}
                        label={t(`types.${r.type.toLowerCase()}`)}
                      />
                    </td>
                    <td>
                      <Chip
                        size="small"
                        variant="filled"
                        color={r.revoked ? "error" : "success"}
                        label={r.revoked ? t("status.revoked") : t("status.active")}
                      />
                    </td>
                    <td>{r.createdAt.toLocaleDateString()}</td>
                    <td>
                      <RowActions>
                        <ViewButton onClick={() => onView(r._id)} iconSize={20} />
                        <EditButton onClick={() => onEdit(r._id)} iconSize={20} />
                        <DuplicateButton
                          onClick={() => onDuplicate(r._id)}
                          iconSize={20}
                          ariaLabel={t("duplicate")}
                          tooltip={t("duplicate")}
                          confirmationDuration={1000}
                        />
                        {r.revoked ? (
                          <AcceptButton
                            onClick={() => onReinstate(r._id)}
                            color="success"
                            iconSize={20}
                            ariaLabel={t("reinstate")}
                            tooltip={t("reinstate")}
                            confirmationDuration={2000}
                          />
                        ) : (
                          <CancelButton
                            onClick={() => onRevoke(r._id)}
                            iconSize={20}
                            ariaLabel={t("revoke")}
                            tooltip={t("revoke")}
                            confirmationDuration={2000}
                          />
                        )}
                        <DeleteButton
                          onClick={() => onDelete(r._id)}
                          confirmationDuration={3000}
                          iconSize={20}
                        />
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      {!loading && rows.length > 0 && (
        <div
          style={{
            fontSize: "0.875rem",
            color: "#666",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between"
          }}
        >
          <div>{t("showing", { count: rows.length })}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BackButton
              color="primary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            <span>
              {page} / {Math.ceil(total / PAGE_SIZE) || 1}
            </span>
            <NextButton
              color="primary"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
            />
          </div>
        </div>
      )}
    </Wrapper>
  );
}
