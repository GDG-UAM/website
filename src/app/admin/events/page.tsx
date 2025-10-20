"use client";

import React, { useRef, useState } from "react";
import styled from "styled-components";
import { EventList } from "@/app/admin/events/EventList";
import { EventForm, EventFormData } from "@/app/admin/events/EventForm";
import { BackButton } from "@/components/Buttons";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import AdminEventsCalendar from "@/app/admin/events/AdminEventsCalendar";
import { withCsrfHeaders } from "@/lib/security/csrfClient";
import { useTranslations } from "next-intl";

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

/**
 * AdminEventsManagePage: Main page for managing events in the admin panel.
 * It allows creating, editing, and listing events.
 */
export default function AdminEventsManagePage() {
  const tPage = useTranslations("admin.events.page");
  const tBreadcrumbs = useTranslations("admin.breadcrumbs");
  // State to manage the current mode (list, create, edit)
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  // State to manage the currently editing event ID
  const [editingId, setEditingId] = useState<string | null>(null);
  // State to manage the refresh token for the event list
  const [refreshToken, setRefreshToken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<EventFormData>>();

  const goToList = () => {
    setMode("list");
    setEditingId(null);
    setInitialData(undefined);
    setRefreshToken((t) => t + 1); // Refresh the list
  };

  const handleCreate = (dateIso?: string) => {
    // Prefill when invoked from calendar; normalize to datetime-local value.
    const toLocalInput = (iso?: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      // Convert to local datetime-local format: YYYY-MM-DDTHH:mm
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    };
    setInitialData(dateIso ? { date: toLocalInput(dateIso) } : {});
    setMode("create");
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
    const res = await fetch(`/api/admin/events/${id}`);
    if (res.ok) {
      const data = await res.json();
      // Input datetime-local needs a format (YYYY-MM-DDTHH:mm)
      const toLocalInput = (iso?: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}`;
      };
      setInitialData({ ...data, date: toLocalInput(data.date) });
      setMode("edit");
    } else {
      newErrorToast("Error al cargar los datos del evento.");
    }
  };

  const handleSubmit = async (data: EventFormData) => {
    setSubmitting(true);
    // If creator mode -> new event, If editor mode -> update event
    const url = mode === "create" ? "/api/admin/events" : `/api/admin/events/${editingId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...data,
          // data.date is in datetime-local format (local time). Convert safely to ISO.
          date: (() => {
            const v = data.date;
            if (!v) return null;
            const d = new Date(v);
            if (isNaN(d.getTime())) return null;
            return d.toISOString();
          })()
        })
      });
      if (res.ok) {
        newSuccessToast(
          mode === "create" ? "Evento creado con éxito" : "Evento actualizado con éxito"
        );
        goToList();
      } else {
        const errorData = await res.json();
        newErrorToast(errorData.error || "Ocurrió un error.");
      }
    } catch {
      newErrorToast("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "DELETE",
      headers: await withCsrfHeaders()
    });
    if (res.ok) {
      newSuccessToast("Evento eliminado con éxito.");
      goToList();
    } else {
      newErrorToast("Error al eliminar el evento.");
    }
  };

  const [listView, setListView] = useState<"table" | "calendar">("table");
  const calendarRef = useRef<React.ElementRef<typeof AdminEventsCalendar>>(null);

  return (
    <Container>
      <AdminBreadcrumbs
        items={[
          { label: tBreadcrumbs("admin"), href: "/admin" },
          { label: tBreadcrumbs("events"), href: "/admin/events" }
        ]}
      />

      <Header>
        <Title>
          {mode === "list" && tPage("title")}
          {mode === "create" && tPage("createTitle")}
          {mode === "edit" && tPage("editTitle")}
        </Title>
      </Header>

      {mode !== "list" && (
        <div style={{ marginBottom: "20px" }}>
          <BackButton onClick={goToList}>{tPage("backToList")}</BackButton>
        </div>
      )}

      {mode === "list" && (
        <div style={{ display: "grid", gap: 12 }}>
          <ToggleGroup>
            <ToggleBtn
              type="button"
              aria-pressed={listView === "table"}
              $active={listView === "table"}
              onClick={() => setListView("table")}
            >
              {tPage("listView")}
            </ToggleBtn>
            <ToggleBtn
              type="button"
              aria-pressed={listView === "calendar"}
              $active={listView === "calendar"}
              onClick={() => {
                setListView("calendar");
                // Asegurar que el calendario carga si todavía no hay datos
                queueMicrotask(() => calendarRef.current?.ensureLoaded());
              }}
            >
              {tPage("calendarView")}
            </ToggleBtn>
          </ToggleGroup>
          {listView === "table" ? (
            <EventList
              onCreate={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              refreshToken={refreshToken}
              onView={(slug) => window.open(`/events/${slug}`, "_blank")}
            />
          ) : (
            <AdminEventsCalendar
              ref={calendarRef}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onView={(slug) => window.open(`/events/${slug}`, "_blank")}
            />
          )}
        </div>
      )}

      {(mode === "create" || (mode === "edit" && initialData)) && (
        <EventForm
          key={editingId || "create"}
          initial={initialData}
          onCancel={goToList}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </Container>
  );
}

// Botón de alternancia (Lista / Calendario)
// Mejora: centrado dentro del grid, mayor contraste, y mejor hover/focus
const ToggleGroup = styled.div`
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 3px;
  gap: 4px;
  justify-self: center; /* centra el grupo dentro del contenedor grid */
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02) inset;

  /* En pantallas pequeñas, que no se pegue a los bordes y permita wrap si hiciera falta */
  @media (max-width: 480px) {
    padding: 2px;
    gap: 2px;
  }
`;

const ToggleBtn = styled.button<{ $active?: boolean }>`
  appearance: none;
  border: 0;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: ${({ $active }) => ($active ? "#0b57d0" : "#111827")};
  background: ${({ $active }) => ($active ? "#e8f0fe" : "transparent")};
  cursor: pointer;
  outline: none;
  transition:
    background 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;
  user-select: none;

  &:hover {
    background: ${({ $active }) => ($active ? "#dbe7fd" : "#e5e7eb")};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.35);
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 12px;
  }
`;
