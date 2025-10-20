"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { Chip } from "@mui/material";
import LocalTime from "@/components/LocalTime";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { BackButton, OpenLinkButton, CopyButton, EditButton } from "@/components/Buttons";

type EventDetail = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  date: string; // ISO
  location: string;
  image?: string;
  status: "draft" | "published";
  url?: string;
};

const Page = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px;
`;

const Header = styled.header`
  display: grid;
  gap: 12px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  h1 {
    font-size: 1.8rem;
    line-height: 1.2;
    margin: 0;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
`;

const MetaList = styled.div`
  display: grid;
  gap: 10px;
  font-size: 14px;

  dt {
    color: #6b7280;
  }
  dd {
    margin: 0;
    color: #111827;
  }
`;

const MetaItem = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Img = styled.img`
  width: 100%;
  height: auto;
  border-radius: 10px;
  border: 1px solid #eef0f3;
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const Skeleton = styled.div`
  height: 14px;
  border-radius: 6px;
  background: #f1f5f9;
  background-image: linear-gradient(90deg, #f1f5f9 0px, #e5e7eb 40px, #f1f5f9 80px);
  background-size: 200px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
`;

export default function AdminEventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const slug = params?.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      // Admin: buscar por slug (sin exponer acceso por _id)
      const [pubRes, draftRes] = await Promise.all([
        fetch(`/api/admin/events?status=published&page=1&pageSize=100`),
        fetch(`/api/admin/events?status=draft&page=1&pageSize=100`)
      ]);
      if (!pubRes.ok && !draftRes.ok) throw new Error("No se pudo cargar el evento");
      const [pubData, draftData] = await Promise.all([
        pubRes.ok ? pubRes.json() : Promise.resolve({ items: [] }),
        draftRes.ok ? draftRes.json() : Promise.resolve({ items: [] })
      ]);
      const merged = [...(pubData.items || []), ...(draftData.items || [])] as EventDetail[];
      const found = merged.find((e) => e.slug === slug) || null;
      if (!found) throw new Error("Evento no encontrado");
      setEvent(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load event");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Admin", href: "/admin" },
      { label: "Eventos", href: "/admin/events" },
      { label: loading ? "Cargando…" : event?.title || "Evento" }
    ],
    [loading, event]
  );

  const statusChip = (status: "draft" | "published") => (
    <Chip
      size="small"
      variant="outlined"
      color={status === "published" ? "success" : "warning"}
      label={status === "published" ? "Publicado" : "Borrador"}
    />
  );

  return (
    <Page>
      <AdminBreadcrumbs items={breadcrumbs} />

      <Header>
        <div>
          <Actions>
            <BackButton onClick={() => router.push("/admin/events")} />
            {event?.url && <OpenLinkButton href={event.url} />}
            {event && <CopyButton content={`/${event.slug}`} />}
            {event && <EditButton onClick={() => router.push(`/admin/events?edit=${event._id}`)} />}
          </Actions>
        </div>

        <TitleRow>
          <h1>{loading ? <Skeleton style={{ width: 220, height: 24 }} /> : event?.title}</h1>
          {!loading && event && statusChip(event.status)}
        </TitleRow>
      </Header>

      <Grid>
        <Card>
          {loading ? (
            <div style={{ display: "grid", gap: 10 }}>
              <Skeleton style={{ height: 18, width: "80%" }} />
              <Skeleton style={{ height: 14, width: "95%" }} />
              <Skeleton style={{ height: 14, width: "90%" }} />
              <Skeleton style={{ height: 14, width: "85%" }} />
              <Skeleton style={{ height: 14, width: "75%" }} />
            </div>
          ) : error ? (
            <div style={{ color: "#b91c1c" }}>No se pudo cargar el evento: {error}</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {event?.image && <Img src={event.image} alt={event.title} />}
              <div style={{ whiteSpace: "pre-wrap", color: "#111827" }}>{event?.description}</div>
            </div>
          )}
        </Card>

        <Card>
          <MetaList as="dl">
            <MetaItem>
              <dt>Fecha</dt>
              <dd>
                {loading || !event ? (
                  <Skeleton style={{ width: 160 }} />
                ) : (
                  <LocalTime iso={event.date} dateOnly={false} />
                )}
              </dd>
            </MetaItem>

            <MetaItem>
              <dt>Ubicación</dt>
              <dd>{loading || !event ? <Skeleton style={{ width: 120 }} /> : event.location}</dd>
            </MetaItem>

            <MetaItem>
              <dt>Slug</dt>
              <dd>{loading || !event ? <Skeleton style={{ width: 100 }} /> : `/${event.slug}`}</dd>
            </MetaItem>

            <MetaItem>
              <dt>ID</dt>
              <dd>{loading || !event ? <Skeleton style={{ width: 220 }} /> : event._id}</dd>
            </MetaItem>

            <MetaItem>
              <dt>Estado</dt>
              <dd>
                {loading || !event ? <Skeleton style={{ width: 90 }} /> : statusChip(event.status)}
              </dd>
            </MetaItem>

            {event?.url && (
              <MetaItem>
                <dt>Enlace</dt>
                <dd>
                  <a href={event.url} target="_blank" rel="noopener noreferrer">
                    {event.url}
                  </a>
                </dd>
              </MetaItem>
            )}
          </MetaList>
        </Card>
      </Grid>
    </Page>
  );
}
