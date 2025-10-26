"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import Modal from "@/components/Modal";
import { useTranslations } from "next-intl";
import {
  AddButton,
  EditButton,
  DeleteButton,
  BackButton,
  SaveButton,
  CancelButton,
  NextButton,
  ReloadButton
} from "@/components/Buttons";
import {
  TextField,
  Select as MUISelect,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Chip
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

// Simple types mirrored from backend
type Env = "development" | "production";
type EnvFilter = "all" | Env;

type FeatureFlag = {
  _id: string;
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  rolloutPercentage: number;
  targetUsers: string[];
  excludeUsers: string[];
  environment: Env;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
};

const Container = styled.div`
  display: grid;
  gap: 12px;
  padding: 12px;
  overflow-x: hidden; /* Prevent horizontal overflow */
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

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  max-width: 100%; /* Prevent card from exceeding container */
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid #f3f4f6;
    padding: 10px 8px;
    text-align: left;
    vertical-align: top;
    font-size: 14px;
  }

  th {
    color: #374151;
    font-weight: 600;
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

const MonoText = styled.span`
  font-family: monospace;
  font-size: 0.9rem;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
`;

function useFlagsQuery(query: {
  env: EnvFilter;
  q: string;
  isActive: "all" | "true" | "false";
  page: number;
  refreshKey?: number;
}) {
  const params = new URLSearchParams();
  if (query.env !== "all") params.set("environment", query.env);
  if (query.q) params.set("q", query.q);
  if (query.isActive !== "all") params.set("isActive", query.isActive);
  params.set("page", String(query.page));
  params.set("pageSize", "20");
  if (typeof query.refreshKey === "number") params.set("r", String(query.refreshKey));
  const url = `/api/admin/feature-flags?${params.toString()}`;

  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    data?: { items: FeatureFlag[]; total: number; page: number; pageSize: number };
  }>({ loading: true });

  useEffect(() => {
    let aborted = false;
    setState({ loading: true });
    fetch(url)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Request failed");
        if (!aborted) setState({ loading: false, data: j });
      })
      .catch((e) => !aborted && setState({ loading: false, error: e.message }));
    return () => {
      aborted = true;
    };
  }, [url]);

  return state;
}

type Draft = Partial<FeatureFlag> & { name: string; key: string; environment: Env };

function FlagModal({
  initial,
  onClose,
  onSaved
}: {
  initial?: Draft;
  onClose: () => void;
  onSaved: (flag: FeatureFlag) => void;
}) {
  const t = useTranslations("admin.featureFlags");
  const [draft, setDraft] = useState<Draft>(
    initial || {
      name: "",
      key: "",
      environment: "development",
      description: "",
      isActive: false,
      rolloutPercentage: 0,
      targetUsers: [],
      excludeUsers: [],
      metadata: {}
    }
  );
  const isEdit = !!initial;
  const canSave = draft.name.trim() && draft.key.trim();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      name: draft.name,
      key: draft.key,
      description: draft.description,
      isActive: !!draft.isActive,
      rolloutPercentage: Number(draft.rolloutPercentage || 0),
      targetUsers: draft.targetUsers || [],
      excludeUsers: draft.excludeUsers || [],
      environment: draft.environment,
      metadata: draft.metadata || {}
    };

    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/feature-flags/${encodeURIComponent(draft.key)}?environment=${draft.environment}`
          : "/api/admin/feature-flags",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(isEdit ? { ...payload, environment: draft.environment } : payload)
        }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to save");
      onSaved(j as FeatureFlag);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      title={isEdit ? t("modal.editTitle") : t("modal.createTitle")}
      width="md"
      buttons={[
        <CancelButton key="cancel" onClick={onClose}>
          {t("actions.cancel")}
        </CancelButton>,
        <SaveButton key="save" onClick={handleSave} disabled={!canSave || saving} showSpinner>
          {saving ? t("actions.saving") : t("actions.save")}
        </SaveButton>
      ]}
      buttonPosition="right"
    >
      <div style={{ display: "grid", gap: 10 }}>
        <TextField
          label={t("form.name")}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          fullWidth
          size="small"
          margin="dense"
        />
        <TextField
          label={t("form.key")}
          disabled={isEdit}
          value={draft.key}
          onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          fullWidth
          size="small"
          margin="dense"
        />
        <FormControl fullWidth size="small" margin="dense" disabled={isEdit}>
          <InputLabel id="env-select-label">{t("form.environment")}</InputLabel>
          <MUISelect
            labelId="env-select-label"
            label={t("form.environment")}
            value={draft.environment}
            onChange={(e) => setDraft({ ...draft, environment: e.target.value as Env })}
          >
            <MenuItem value="development">{t("env.development")}</MenuItem>
            <MenuItem value="production">{t("env.production")}</MenuItem>
          </MUISelect>
        </FormControl>
        <TextField
          label={t("form.description")}
          value={draft.description || ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          fullWidth
          size="small"
          margin="dense"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
          }
          label={t("form.active")}
        />
        <TextField
          label={t("form.rollout")}
          type="number"
          inputProps={{ min: 0, max: 100 }}
          value={draft.rolloutPercentage ?? 0}
          onChange={(e) => setDraft({ ...draft, rolloutPercentage: Number(e.target.value) })}
          fullWidth
          size="small"
          margin="dense"
        />
        <TextField
          label={t("form.targets")}
          placeholder={t("form.idsPlaceholder")}
          value={(draft.targetUsers || []).join(", ")}
          onChange={(e) =>
            setDraft({
              ...draft,
              targetUsers: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            })
          }
          fullWidth
          size="small"
          margin="dense"
        />
        <TextField
          label={t("form.excludes")}
          placeholder={t("form.idsPlaceholder")}
          value={(draft.excludeUsers || []).join(", ")}
          onChange={(e) =>
            setDraft({
              ...draft,
              excludeUsers: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            })
          }
          fullWidth
          size="small"
          margin="dense"
        />
      </div>
    </Modal>
  );
}

export default function FeatureFlagsAdminPage() {
  const t = useTranslations("admin.featureFlags");
  const [q, setQ] = useState("");
  const [env, setEnv] = useState<EnvFilter>("all");
  const [isActive, setIsActive] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<
    { type: "create" } | { type: "edit"; flag: FeatureFlag } | null
  >(null);

  const state = useFlagsQuery({ env, q, isActive, page, refreshKey });

  const items = state.data?.items || [];

  // Inline toggle disabled; edits happen in modal. Use refreshKey after updates.

  async function remove(flag: FeatureFlag) {
    const res = await fetch(
      `/api/admin/feature-flags/${encodeURIComponent(flag.key)}?environment=${flag.environment}`,
      { method: "DELETE", headers: await withCsrfHeaders() }
    );
    if (!res.ok) {
      const j: { error?: string } = await res.json().catch(() => ({}) as { error?: string });
      throw new Error(j.error || "Delete failed");
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: t("breadcrumbs.admin"), href: "/admin" },
          { label: t("breadcrumbs.featureFlags") }
        ]}
      />

      <Header>
        <Title>{t("title")}</Title>
      </Header>

      <Controls>
        <AddButton onClick={() => setModal({ type: "create" })}>
          {t("actions.createFeatureFlag")}
        </AddButton>
        <ReloadButton onClick={() => setRefreshKey((k) => k + 1)}>
          {t("actions.reload")}
        </ReloadButton>
        <FormControl size="small" style={{ minWidth: 180 }}>
          <InputLabel id="filter-env-label">{t("filters.environment")}</InputLabel>
          <MUISelect
            labelId="filter-env-label"
            label={t("filters.environment")}
            value={env}
            onChange={(e: SelectChangeEvent) => setEnv(e.target.value as EnvFilter)}
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="development">{t("env.development")}</MenuItem>
            <MenuItem value="production">{t("env.production")}</MenuItem>
          </MUISelect>
        </FormControl>
        <FormControl size="small" style={{ minWidth: 160 }}>
          <InputLabel id="filter-status-label">{t("filters.status")}</InputLabel>
          <MUISelect
            labelId="filter-status-label"
            label={t("filters.status")}
            value={isActive}
            onChange={(e: SelectChangeEvent) =>
              setIsActive(e.target.value as "all" | "true" | "false")
            }
          >
            <MenuItem value="all">{t("filters.all")}</MenuItem>
            <MenuItem value="true">{t("status.active")}</MenuItem>
            <MenuItem value="false">{t("status.inactive")}</MenuItem>
          </MUISelect>
        </FormControl>
        <TextField
          placeholder={t("filters.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          style={{ marginLeft: "auto", minWidth: "250px" }}
        />
      </Controls>

      <Card>
        {state.loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
        ) : state.error ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#b91c1c" }}>
            {state.error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            {q || env !== "all" || isActive !== "all"
              ? "No feature flags match your filters"
              : "No feature flags yet. Create one to get started!"}
          </div>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>{t("table.key")}</th>
                  <th style={{ width: 200 }}>{t("table.name")}</th>
                  <th>{t("table.description")}</th>
                  <th>{t("table.env")}</th>
                  <th>{t("table.rollout")}</th>
                  <th>{t("table.active")}</th>
                  <th>{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={`${f.key}-${f.environment}`}>
                    <td>
                      <MonoText>{f.key}</MonoText>
                    </td>
                    <td>{f.name}</td>
                    <td style={{ color: "#374151" }}>{f.description || "—"}</td>
                    <td>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={f.environment === "production" ? "success" : "warning"}
                        label={t(`env.${f.environment}`)}
                      />
                    </td>
                    <td>{f.rolloutPercentage}</td>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Checkbox checked={f.isActive} disabled />
                        <span>{f.isActive ? t("status.on") : t("status.off")}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <EditButton
                          onClick={() => setModal({ type: "edit", flag: f })}
                          iconSize={20}
                        />
                        <DeleteButton onClick={() => remove(f)} iconSize={20} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      {!state.loading && items.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <BackButton onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {t("actions.previous")}
          </BackButton>
          <span>
            {t("pagination.page")} {state.data?.page}
          </span>
          <NextButton onClick={() => setPage((p) => p + 1)}>{t("actions.next")}</NextButton>
        </div>
      )}

      {modal && (
        <FlagModal
          initial={modal.type === "edit" ? { ...modal.flag } : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </Container>
  );
}
