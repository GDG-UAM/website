"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { SaveButton, CancelButton } from "@/components/Buttons";
import { TextField, MenuItem } from "@mui/material";
import { useTranslations } from "next-intl";
import RenderMarkdown from "@/components/markdown/RenderMarkdown";
import { renderMarkdown } from "@/lib/markdown";

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 900px;
`;

// gap: Hace 16px de espacio entre los elementos del formulario

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
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
`;

// Define la estructura de los datos del formulario
export type EventFormData = {
  title: string;
  slug?: string;
  description: string;
  date: string; // Usamos string para el input datetime-local
  location: string;
  image?: string;
  status: "draft" | "published";
  url?: string;
  // Nuevo contenido en formato Markdown
  markdownContent: string;
  // Enlace al post del blog relacionado (opcional)
  blogUrl?: string;
};

// EventForm: Componente para el formulario de eventos
export function EventForm({
  initial,
  onCancel,
  onSubmit
}: {
  initial?: Partial<EventFormData>;
  onCancel?: () => void;
  onSubmit: (data: EventFormData) => Promise<void> | void;
  submitting?: boolean;
}) {
  const t = useTranslations("admin.events.form");
  // Inicializing state of the form
  const [data, setData] = useState<EventFormData>({
    title: initial?.title || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    // If an initial date is an ISO/UTC string (contains a timezone or trailing Z),
    // convert it to the local `datetime-local` input format (yyyy-MM-ddTHH:mm).
    date: (() => {
      const v = initial?.date;
      if (!v) return "";
      try {
        const hasTZ = /Z$|[+\-]\d{2}:?\d{2}$/.test(v);

        // If no timezone info, assume the server intended UTC and append 'Z'
        // before parsing so `new Date()` interprets it as UTC.
        const parseInput = hasTZ ? v : `${v}Z`;
        const d = new Date(parseInput);
        if (isNaN(d.getTime())) return v;
        const pad = (n: number) => String(n).padStart(2, "0");
        const seconds = d.getSeconds();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}${seconds ? `:${pad(seconds)}` : ``}`;
      } catch {
        return v;
      }
    })(),
    location: initial?.location || "",
    image: initial?.image || "",
    status: initial?.status || "draft",
    url: initial?.url || "",
    // markdownContent inicial
    markdownContent: initial?.markdownContent || "",
    blogUrl:
      initial && "blogUrl" in initial && typeof initial.blogUrl === "string" ? initial.blogUrl : ""
  });

  // Handle form submission: Initialize form data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: EventFormData = {
      ...data,
      date: (() => {
        const v = data.date;
        if (!v) return v;
        try {
          if (/Z$|[+\-]\d{2}:\d{2}$/.test(v)) return v;
          const d = new Date(v);
          if (isNaN(d.getTime())) return v;
          return d.toISOString();
        } catch {
          return v;
        }
      })()
    };

    await onSubmit(payload);
  };

  const submitViaButton = () => {
    const form = document.getElementById("event-form") as HTMLFormElement | null;
    form?.requestSubmit();
  };

  // Vista previa: renderiza cabecera (título, fecha/hora, imagen, descripción) + contenido Markdown
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const headerHtml = useMemo(() => {
    const parts: string[] = [];
    if (data.title?.trim()) parts.push(`<h1>${escapeHtml(data.title.trim())}</h1>`);
    // Fecha/hora local legible si existe
    if (data.date) {
      try {
        const d = new Date(data.date);
        const formatted = isNaN(d.getTime())
          ? data.date
          : d.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            });
        parts.push(`<p><strong>${t("date")}:</strong> ${escapeHtml(formatted)}</p>`);
      } catch {
        // ignore
      }
    }
    if (data.image?.trim()) {
      const url = escapeHtml(data.image.trim());
      parts.push(
        `<p><img src="${url}" alt="event image" style="max-width:100%;height:auto;border-radius:6px"/></p>`
      );
    }
    if (data.description?.trim()) {
      parts.push(`<p>${escapeHtml(data.description.trim())}</p>`);
    }
    return parts.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.title, data.date, data.image, data.description]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const md = data.markdownContent || "";
      const rendered = await renderMarkdown(md);
      if (!cancelled) setPreviewHtml(`${headerHtml}\n${rendered.html}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [data.markdownContent, headerHtml]);

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return (
    <Form id="event-form" onSubmit={handleSubmit}>
      <TextField
        label={t("title")}
        value={data.title}
        onChange={(e) => setData({ ...data, title: e.target.value })}
        required
      />

      <TwoCol>
        <TextField
          label={t("slug")}
          value={data.slug}
          onChange={(e) => setData({ ...data, slug: e.target.value })}
          placeholder={t("slugPlaceholder")}
        />
        <TextField
          label={t("status")}
          value={data.status}
          onChange={(e) => setData({ ...data, status: e.target.value as EventFormData["status"] })}
          select
        >
          <MenuItem value="draft">{t("statusOptions.draft")}</MenuItem>
          <MenuItem value="published">{t("statusOptions.published")}</MenuItem>
        </TextField>
      </TwoCol>

      <TwoCol>
        <TextField
          label={t("date")}
          type="datetime-local"
          value={data.date}
          onChange={(e) => setData({ ...data, date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label={t("location")}
          value={data.location}
          onChange={(e) => setData({ ...data, location: e.target.value })}
          required
        />
      </TwoCol>

      <TextField
        label={t("description")}
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        multiline
        minRows={5}
        required
      />

      <TwoCol>
        <TextField
          label={t("imageUrl")}
          value={data.image}
          onChange={(e) => setData({ ...data, image: e.target.value })}
          placeholder="https://ejemplo.com/imagen.png"
        />
        <TextField
          label={t("externalUrl")}
          value={data.url}
          onChange={(e) => setData({ ...data, url: e.target.value })}
          placeholder="https://meetup.com/evento"
        />
      </TwoCol>

      {/* Blog URL */}
      <TextField
        label={t("blogUrl")}
        value={data.blogUrl}
        onChange={(e) => setData({ ...data, blogUrl: e.target.value })}
        placeholder="https://blog.tu-sitio.com/post"
      />

      {/* Editor Markdown + Vista previa */}
      <TwoCol>
        <TextField
          label={t("content")}
          value={data.markdownContent}
          onChange={(e) => setData({ ...data, markdownContent: e.target.value })}
          placeholder={
            // next-intl may not have the key; provide a plain fallback
            (() => {
              try {
                return t("contentPlaceholder");
              } catch {
                return "Escribe contenido en Markdown...";
              }
            })()
          }
          multiline
          minRows={10}
          required
        />
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("preview")}</div>
          <RenderMarkdown html={previewHtml} />
        </div>
      </TwoCol>

      <Actions>
        <SaveButton onClick={submitViaButton} showSpinner>
          {t("save")}
        </SaveButton>
        {onCancel && <CancelButton onClick={onCancel}>{t("cancel")}</CancelButton>}
      </Actions>
    </Form>
  );
}
