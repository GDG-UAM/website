"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, dateColumn } from "@/components/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, ManageButton } from "@/components/Buttons";
import { useRouter } from "next/navigation";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

interface HackathonListItem {
  _id: string;
  title: string;
  date: string;
  endDate: string;
  location?: string;
}

interface HackathonListProps {
  onCreate: () => void;
  onEdit: (id: string) => void;
}

const PAGE_SIZE = 10;

export default function HackathonList({ onCreate, onEdit }: HackathonListProps) {
  const t = useTranslations("admin.hackathons");
  const router = useRouter();
  const [items, setItems] = useState<HackathonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchList = useCallback(
    async (isReload = false) => {
      try {
        if (isReload) setLoading(true);
        const res = await fetch(`/api/admin/hackathons?page=${page}&pageSize=${PAGE_SIZE}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        if (isReload) newSuccessToast(t("toasts.reloaded"));
      } catch {
        newErrorToast(t("toasts.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [page, t]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/hackathons/${id}`, {
        method: "DELETE",
        headers: await withCsrfHeaders({})
      });
      if (!res.ok) throw new Error();
      newSuccessToast(t("toasts.deleted"));
      fetchList();
    } catch {
      newErrorToast(t("toasts.deleteError"));
    }
  };

  return (
    <AdminTable
      columns={[
        textColumn<HackathonListItem>("title", t("list.columns.title"), (it) => it.title, {
          bold: true
        }),
        dateColumn<HackathonListItem>("date", t("list.columns.date"), (it) => it.date),
        dateColumn<HackathonListItem>("endDate", t("list.columns.endDate"), (it) => it.endDate),
        textColumn<HackathonListItem>("location", t("list.columns.location"), (it) => it.location)
      ]}
      data={items}
      loading={loading}
      onReload={() => fetchList(true)}
      reloadLabel={t("list.reload")}
      headerActions={<AddButton onClick={onCreate}>{t("list.create")}</AddButton>}
      rowActions={(it) => (
        <>
          <ManageButton
            ariaLabel={t("list.manage")}
            onClick={() => router.push(`/admin/hackathons/${it._id}`)}
            iconSize={20}
          />
          <EditButton onClick={() => onEdit(it._id)} iconSize={20} />
          <DeleteButton onClick={() => handleDelete(it._id)} iconSize={20} />
        </>
      )}
      emptyMessage={t("list.noHackathons")}
      noResultsMessage={t("list.noResults")}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total,
        onPageChange: setPage
      }}
    />
  );
}
