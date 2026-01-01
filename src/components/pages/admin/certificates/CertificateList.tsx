"use client";

import { api } from "@/lib/eden";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AddButton,
  EditButton,
  ViewButton,
  DeleteButton,
  DuplicateButton,
  CancelButton,
  AcceptButton
} from "@/components/Buttons";
import { useTranslations } from "next-intl";
import { newErrorToast, newInfoToast } from "@/components/Toast";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, chipColumn, dateColumn } from "@/components/admin/AdminTableFactories";

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

  const columns = useMemo(
    () => [
      textColumn<CertificateInterface>("title", t("columns.title"), (r) => r.title, {
        bold: true,
        subValue: (r) => r.publicId
      }),
      textColumn<CertificateInterface>("recipient", t("columns.recipient"), (r) => r.recipientName),
      chipColumn<CertificateInterface, CertificateType>(
        "type",
        t("columns.type"),
        (r) => r.type,
        (type) => t(`types.${type.toLowerCase()}`),
        (type) => typeColors[type]
      ),
      chipColumn<CertificateInterface, "active" | "revoked">(
        "status",
        t("columns.status"),
        (r) => (r.revoked ? "revoked" : "active"),
        (status) => t(`status.${status}`),
        (status) => (status === "active" ? "success" : "error"),
        "filled"
      ),
      dateColumn<CertificateInterface>("createdAt", t("columns.created"), (r) => r.createdAt)
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
          <DeleteButton onClick={() => onDelete(r._id)} confirmationDuration={3000} iconSize={20} />
        </>
      )}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t("searchPlaceholder")
      }}
      filters={[
        {
          key: "type",
          label: t("filterType"),
          value: typeFilter,
          onChange: (v) => setTypeFilter(v as CertificateType | ""),
          options: [
            { label: t("allTypes"), value: "" },
            { label: t("types.courseCompletion"), value: "COURSE_COMPLETION" },
            { label: t("types.eventAchievement"), value: "EVENT_ACHIEVEMENT" },
            { label: t("types.participation"), value: "PARTICIPATION" },
            { label: t("types.volunteer"), value: "VOLUNTEER" }
          ],
          minWidth: "150px"
        },
        {
          key: "revoked",
          label: t("showRevoked"),
          value: includeRevoked ? "yes" : "no",
          onChange: (v) => setIncludeRevoked(v === "yes"),
          options: [
            { label: t("hideRevoked"), value: "no" },
            { label: t("showRevokedYes"), value: "yes" }
          ],
          minWidth: "140px"
        }
      ]}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total,
        onPageChange: setPage
      }}
      emptyMessage={t("noCertificates")}
      noResultsMessage={t("noResults")}
    />
  );
}
