"use client";
import { api } from "@/lib/eden";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Chip
} from "@mui/material";
import { ReloadButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import config from "@/lib/config";
import { useTranslations } from "next-intl";
import { newErrorToast, newSuccessToast } from "@/components/_toasts/toastEmitter";

const Wrapper = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
`;
const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 0;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;
const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 8px;
`;
const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const Avatar = styled.img`
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
`;
const Name = styled.div`
  font-weight: 600;
`;
const Email = styled.div`
  color: #6b7280;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export type UserRowType = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role: "user" | "team" | "admin";
};

export default function PermissionsPage() {
  const t = useTranslations("admin.permissions");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [rows, setRows] = useState<UserRowType[]>([]);
  const [total, setTotal] = useState(0);
  const [myRole, setMyRole] = useState<"user" | "team" | "admin">("user");
  const [myEmail, setMyEmail] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const load = useCallback(async () => {
    const { data, error } = await api.admin.users.get({
      query: {
        q: search,
        page: page,
        pageSize: pageSize
      }
    });
    if (error) {
      newErrorToast(t("toasts.loadError"));
      return;
    }
    setRows(data.items || []);
    setTotal(data.total || 0);
  }, [search, page, pageSize, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Load current user's role from session
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json();
        const role = (data?.user?.role as "user" | "team" | "admin") || "user";
        setMyRole(role);
        setMyEmail((data?.user?.email as string) || null);
      } catch {}
    })();
  }, []);

  const assoc = (config.associationEmail || "").toLowerCase();

  const updateRole = async (id: string, role: "user" | "team" | "admin") => {
    const prev = rows.find((r) => r._id === id)?.role;
    setRows((prevRows) => prevRows.map((r) => (r._id === id ? { ...r, role } : r)));

    // Assuming the API expects { id, role } in the body for PATCH /api/admin/users
    // If the previous implementation was PATCH /api/admin/users with body { id, role }
    const { error } = await api.admin.users.patch({ id, role });

    if (error) {
      newErrorToast(t("toasts.updateError"));
      // revert
      setRows((prevRows) =>
        prevRows.map((r) => (r._id === id ? { ...r, role: prev || r.role } : r))
      );
    } else {
      newSuccessToast(t("toasts.updateSuccess"));
    }
  };

  return (
    <Wrapper>
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: t("title") }]} />
      <Controls>
        <TextField
          size="small"
          label={t("search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <ReloadButton onClick={load} showSpinner={true} />
        <Chip label={`${t("total")}: ${total}`} variant="outlined" size="small" />
      </Controls>

      <Grid>
        {rows.map((u) => {
          const isAssoc = assoc && String(u.email || "").toLowerCase() === assoc;
          const value = isAssoc ? "admin" : u.role;
          // UI rules:
          // - Team users cannot change any roles
          // - Admins can't change admin users and can't set admin
          // - Superadmin can change anything
          const isTeamViewer = myRole === "team";
          const isAdminViewer = myRole === "admin" && !isTeamViewer;
          const viewerIsAssoc = !!(assoc && myEmail && myEmail.toLowerCase() === assoc);
          const disabled =
            isAssoc ||
            (!viewerIsAssoc && (isAssoc || isTeamViewer || (isAdminViewer && u.role === "admin")));
          return (
            <Card key={u._id}>
              <UserRow>
                <Avatar src={u.image || "/logo/196x196.webp"} alt={u.name || u.email} />
                <div>
                  <Name>{u.name || "—"}</Name>
                  <Email>{u.email}</Email>
                </div>
              </UserRow>
              <FormControl size="small">
                <InputLabel id={`role-${u._id}`}>{t("role")}</InputLabel>
                <Select
                  labelId={`role-${u._id}`}
                  label={t("role")}
                  value={value}
                  disabled={disabled}
                  onChange={(e) => updateRole(u._id, e.target.value as "user" | "team" | "admin")}
                >
                  <MenuItem value="admin" disabled={!viewerIsAssoc}>
                    {isAssoc ? t("roles.superadmin") : t("roles.admin")}
                  </MenuItem>
                  <MenuItem value="team" disabled={isTeamViewer}>
                    {t("roles.team")}
                  </MenuItem>
                  <MenuItem value="user" disabled={isTeamViewer}>
                    {t("roles.user")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Card>
          );
        })}
      </Grid>

      <div style={{ display: "flex", justifyContent: "center", padding: 10 }}>
        <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
      </div>
    </Wrapper>
  );
}
