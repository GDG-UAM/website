"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  CancelButton,
  ReloadButton
} from "@/components/Buttons";
import { useRouter } from "next/navigation";
import { newErrorToast, newSuccessToast } from "@/components/_toasts/toastEmitter";
import { useTranslations } from "next-intl";
import { TextField, Checkbox, FormControlLabel, Chip } from "@mui/material";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

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
  const [mode, setMode] = useState<Mode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [items, setItems] = useState<GiveawayListItem[]>([]);
  const [initial, setInitial] = useState<Partial<GiveawayFormData>>();
  const [loading, setLoading] = useState(true);

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
  };

  const onCreate = () => setMode("create");
  const onEdit = (id: string) => {
    setEditingId(id);
    setMode("edit");
  };

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

  const Container = styled.div`
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  `;

  const Header = styled.div`
    margin-bottom: 20px;
  `;

  const Title = styled.h1`
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  `;

  const Controls = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px 0;
  `;

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
          {mode === "list" && "Giveaway Management"}
          {mode === "create" && "Create New Giveaway"}
          {mode === "edit" && "Edit Giveaway"}
          {mode === "preview" && "Giveaway Preview"}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goList}>{t("form.backToList")}</BackButton>
        </div>
      )}

      {mode === "list" && (
        <div>
          <Controls>
            <AddButton onClick={onCreate}>{t("list.create")}</AddButton>
            <ReloadButton onClick={() => fetchList(true)}>{t("list.reload")}</ReloadButton>
          </Controls>

          <Card>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center" }}>{t("list.loading")}</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                {t("list.noGiveaways")}
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>{t("list.title")}</th>
                    <th style={{ width: 140 }}>{t("list.status")}</th>
                    <th style={{ width: 200 }}>{t("list.start")}</th>
                    <th style={{ width: 200 }}>{t("list.end")}</th>
                    <th style={{ width: 140 }}>{t("list.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{it.title}</div>
                      </td>
                      <td>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={
                            it.status === "active"
                              ? "success"
                              : it.status === "draft"
                                ? "warning"
                                : it.status === "closed" || it.status === "cancelled"
                                  ? "error"
                                  : "default"
                          }
                          label={t(`status.${it.status}`) || it.status}
                        />
                      </td>
                      <td>{it.startAt ? new Date(it.startAt).toLocaleString() : ""}</td>
                      <td>{it.endAt ? new Date(it.endAt).toLocaleString() : ""}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <ViewButton
                            onClick={() => router.push(`/admin/giveaways/${it._id}`)}
                            iconSize={20}
                          />
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
                          <DeleteButton
                            onClick={() => handleDelete(it._id)}
                            style={{ marginLeft: 6 }}
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

          {!loading && items.length > 0 && (
            <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "8px" }}>
              {t("list.showing", { count: items.length })}
            </div>
          )}
        </div>
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
        <SaveButton onClick={submitViaButton} showSpinner>
          {t("form.save")}
        </SaveButton>
        <CancelButton onClick={onCancel}>{t("form.cancel")}</CancelButton>
      </Actions>
    </Form>
  );
}

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 900px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 10px 8px;
    border-bottom: 1px solid #f3f4f6;
  }
  th {
    text-align: left;
    border-bottom-width: 2px;
  }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;
