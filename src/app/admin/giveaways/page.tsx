"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import styled from "styled-components";
import {
  BackButton,
  AddButton,
  EditButton,
  DeleteButton,
  ViewButton,
  AcceptButton,
  HideButton,
  SaveButton,
  CancelButton
} from "@/components/Buttons";
import { useRouter } from "next/navigation";
import { newErrorToast, newSuccessToast } from "@/components/_toasts/toastEmitter";
import { useTranslations } from "next-intl";
import { TextField, Checkbox, FormControlLabel } from "@mui/material";
import { withCsrfHeaders } from "@/lib/security/csrfClient";
import { AdminTable } from "@/components/admin/AdminTable";
import { textColumn, chipColumn, dateColumn } from "@/components/admin/AdminTableFactories";

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 20px;
  max-width: 100%;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  word-wrap: break-word;
`;

type Mode = "list" | "create" | "edit" | "preview";

type GiveawayListItem = {
  _id: string;
  title: string;
  status: string;
  startAt?: string | null;
  endAt?: string | null;
};

type GiveawayFormData = {
  title: string;
  description?: string;
  mustBeLoggedIn: boolean;
  mustHaveJoinedEventId?: string | null;
  requirePhotoUsageConsent?: boolean;
  requireProfilePublic?: boolean;
  maxWinners: number;
  startAt?: string | null;
  endAt?: string | null;
  durationS?: number | null;
  deviceFingerprinting: boolean;
};

export default function AdminGiveawaysPage() {
  const t = useTranslations("admin.giveaways");
  const tt = useTranslations("admin.giveaways.toasts");
  const tPage = useTranslations("admin.giveaways.page");
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [items, setItems] = useState<GiveawayListItem[]>([]);
  const [initial, setInitial] = useState<Partial<GiveawayFormData>>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const fetchList = useCallback(
    async (notify?: boolean) => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/giveaways");
        if (!res.ok) {
          setItems([]);
          return;
        }
        const j = await res.json();
        setItems(Array.isArray(j.items) ? j.items : j);
        if (notify) {
          newSuccessToast(tt("reloaded") || "List reloaded");
        }
      } catch {
        setItems([]);
        newErrorToast(tt("loadError") || "Failed to load giveaways");
      } finally {
        setLoading(false);
      }
    },
    [tt]
  );

  useEffect(() => {
    fetchList();
  }, [refreshToken, fetchList]);

  const goList = () => {
    setMode("list");
    setEditingId(null);
    setInitial(undefined);
    setRefreshToken((x) => x + 1);
    setPage(1);
  };

  const onCreate = () => setMode("create");
  const onEdit = (id: string) => {
    setEditingId(id);
    setMode("edit");
  };

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    if (mode === "edit" && editingId) {
      (async () => {
        const res = await fetch(`/api/admin/giveaways/${editingId}`);
        if (!res.ok) return;
        const data = await res.json();
        const toLocalInput = (iso?: string | null) => {
          if (!iso) return "";
          const d = new Date(iso);
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
            d.getHours()
          )}:${pad(d.getMinutes())}`;
        };
        setInitial({
          title: data.title,
          description: data.description,
          mustBeLoggedIn: !!data.mustBeLoggedIn,
          mustHaveJoinedEventId: data.mustHaveJoinedEventId || null,
          requirePhotoUsageConsent: !!data.requirePhotoUsageConsent,
          requireProfilePublic: !!data.requireProfilePublic,
          maxWinners: data.maxWinners ?? 1,
          startAt: toLocalInput(data.startAt),
          endAt: toLocalInput(data.endAt),
          durationS: data.durationS ?? null,
          deviceFingerprinting: !!data.deviceFingerprinting
        });
      })();
    } else {
      setInitial(undefined);
    }
  }, [mode, editingId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete giveaway?")) return;
    const res = await fetch(`/api/admin/giveaways/${id}`, {
      method: "DELETE",
      headers: await withCsrfHeaders()
    });
    if (res.ok) {
      newSuccessToast(tt("deleted"));
      goList();
    } else {
      newErrorToast(tt("deleteError"));
    }
  };

  const router = useRouter();

  const toggleStatus = async (id: string, next: "draft" | "active") => {
    try {
      const res = await fetch(`/api/admin/giveaways/${id}`, {
        method: "PATCH",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        newSuccessToast(next === "active" ? tt("updated") : tt("updated"));
        setRefreshToken((x) => x + 1);
      } else {
        newErrorToast(tt("updateError"));
      }
    } catch {
      newErrorToast(tt("updateError"));
    }
  };

  const handleSubmit = async (data: GiveawayFormData) => {
    if (mode === "create") {
      const res = await fetch("/api/admin/giveaways", {
        method: "POST",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...data,
          startAt: data.startAt ? new Date(data.startAt).toISOString() : null,
          endAt: data.endAt ? new Date(data.endAt).toISOString() : null
        })
      });
      if (res.ok) {
        newSuccessToast(tt("created"));
        goList();
      } else {
        newErrorToast(tt("createError"));
      }
    } else if (mode === "edit" && editingId) {
      const res = await fetch(`/api/admin/giveaways/${editingId}`, {
        method: "PATCH",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...data,
          startAt: data.startAt ? new Date(data.startAt).toISOString() : null,
          endAt: data.endAt ? new Date(data.endAt).toISOString() : null
        })
      });
      if (res.ok) {
        newSuccessToast(tt("updated"));
        goList();
      } else {
        newErrorToast(tt("updateError"));
      }
    }
  };

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Giveaways", href: "/admin/giveaways" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && tPage("title")}
          {mode === "create" && tPage("createTitle")}
          {mode === "edit" && tPage("editTitle")}
          {mode === "preview" && tPage("previewTitle")}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goList}>{t("form.backToList")}</BackButton>
        </div>
      )}

      {mode === "list" && (
        <AdminTable
          columns={[
            textColumn<GiveawayListItem>("title", t("list.title"), (it) => it.title, {
              bold: true
            }),
            chipColumn<GiveawayListItem, string>(
              "status",
              t("list.status"),
              (it) => it.status,
              (status) => t(`status.${status}`) || status,
              (status) => {
                if (status === "active") return "success";
                if (status === "draft") return "warning";
                if (status === "closed" || status === "cancelled") return "error";
                return "default";
              }
            ),
            dateColumn<GiveawayListItem>("startAt", t("list.start"), (it) => it.startAt),
            dateColumn<GiveawayListItem>("endAt", t("list.end"), (it) => it.endAt)
          ]}
          data={pagedItems}
          loading={loading}
          onReload={() => fetchList(true)}
          reloadLabel={t("list.reload")}
          headerActions={<AddButton onClick={onCreate}>{t("list.create")}</AddButton>}
          rowActions={(it) => (
            <>
              <ViewButton onClick={() => router.push(`/admin/giveaways/${it._id}`)} iconSize={20} />
              {it.status === "draft" ? (
                <AcceptButton
                  onClick={() => toggleStatus(it._id, "active")}
                  iconSize={20}
                  confirmationDuration={1000}
                />
              ) : (
                <HideButton
                  onClick={() => toggleStatus(it._id, "draft")}
                  iconSize={20}
                  confirmationDuration={1000}
                />
              )}
              <EditButton onClick={() => onEdit(it._id)} iconSize={20} />
              <DeleteButton onClick={() => handleDelete(it._id)} iconSize={20} />
            </>
          )}
          emptyMessage={t("list.noGiveaways")}
          noResultsMessage={t("list.noResults")}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: items.length,
            onPageChange: setPage
          }}
        />
      )}

      {(mode === "create" || mode === "edit") && (
        <GiveawayForm initial={initial} onCancel={goList} onSubmit={handleSubmit} />
      )}
    </Container>
  );
}

function GiveawayForm({
  initial,
  onCancel,
  onSubmit
}: {
  initial?: Partial<GiveawayFormData>;
  onCancel: () => void;
  onSubmit: (data: GiveawayFormData) => void | Promise<void>;
}) {
  const t = useTranslations("admin.giveaways");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mustBeLoggedIn, setMustBeLoggedIn] = useState(true);
  const [mustHaveJoinedEventId, setMustHaveJoinedEventId] = useState("");
  const [requirePhotoUsageConsent, setRequirePhotoUsageConsent] = useState(false);
  const [requireProfilePublic, setRequireProfilePublic] = useState(false);
  const [maxWinners, setMaxWinners] = useState(1);
  const [deviceFingerprinting, setDeviceFingerprinting] = useState(false);

  // Sync incoming initial values into internal state when switching to edit/create
  useEffect(() => {
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setMustBeLoggedIn(initial?.mustBeLoggedIn ?? true);
    setMustHaveJoinedEventId(initial?.mustHaveJoinedEventId || "");
    setRequirePhotoUsageConsent(initial?.requirePhotoUsageConsent ?? false);
    setRequireProfilePublic(initial?.requireProfilePublic ?? false);
    setMaxWinners(initial?.maxWinners ?? 1);
    setDeviceFingerprinting(initial?.deviceFingerprinting ?? false);
  }, [initial]);

  const submit = async () => {
    await onSubmit({
      title,
      description,
      mustBeLoggedIn,
      mustHaveJoinedEventId: mustHaveJoinedEventId || null,
      requirePhotoUsageConsent,
      requireProfilePublic,
      maxWinners: Number(maxWinners),
      deviceFingerprinting
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const submitViaButton = () => {
    const form = document.getElementById("giveaway-form") as HTMLFormElement | null;
    form?.requestSubmit();
  };

  return (
    <Form id="giveaway-form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        required
        label={t("form.title")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextField
        fullWidth
        multiline
        minRows={3}
        label={t("form.description")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <TwoCol>
        <FormControlLabel
          control={
            <Checkbox
              checked={mustBeLoggedIn}
              disabled
              onChange={(e) => setMustBeLoggedIn(e.target.checked)}
            />
          }
          label={t("form.mustBeLoggedIn")}
        />
        <TextField
          fullWidth
          label={t("form.mustHaveJoinedEventId")}
          placeholder={t("form.eventIdPlaceholder")}
          value={mustHaveJoinedEventId}
          onChange={(e) => setMustHaveJoinedEventId(e.target.value)}
        />
      </TwoCol>

      <TwoCol>
        <FormControlLabel
          control={
            <Checkbox
              checked={requirePhotoUsageConsent}
              onChange={(e) => setRequirePhotoUsageConsent(e.target.checked)}
            />
          }
          label={t("form.requirePhotoUsageConsent")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={requireProfilePublic}
              onChange={(e) => setRequireProfilePublic(e.target.checked)}
            />
          }
          label={t("form.requireProfilePublic")}
        />
      </TwoCol>

      <TwoCol>
        <TextField
          type="number"
          slotProps={{
            htmlInput: {
              min: 1
            }
          }}
          label={t("form.maxWinners")}
          value={String(maxWinners)}
          onChange={(e) => setMaxWinners(Number(e.target.value))}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={deviceFingerprinting}
              onChange={(e) => setDeviceFingerprinting(e.target.checked)}
            />
          }
          label={t("form.deviceFingerprinting")}
        />
      </TwoCol>

      <Actions>
        <StyledSaveButton onClick={submitViaButton} showSpinner>
          {t("form.save")}
        </StyledSaveButton>
        <StyledCancelButton onClick={onCancel}>{t("form.cancel")}</StyledCancelButton>
      </Actions>
    </Form>
  );
}

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 900px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 100%;
  }

  /* Ensure all children respect width constraints */
  & > * {
    min-width: 0;
    box-sizing: border-box;
  }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-width: 0;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  /* Ensure children don't overflow */
  & > * {
    min-width: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const StyledSaveButton = styled(SaveButton)`
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledCancelButton = styled(CancelButton)`
  @media (max-width: 768px) {
    width: 100%;
  }
`;
