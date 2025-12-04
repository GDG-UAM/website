import { getEventBySlug } from "@/lib/controllers/eventController";
import { buildSectionMetadata } from "@/lib/metadata";
import EventDateTime from "@/components/EventDateTime";
import Link from "next/link";
import CoverImage from "@/components/CoverImage";
import RenderMarkdown from "@/components/markdown/RenderMarkdown";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const revalidate = 60;

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function generateMetadata(context: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await context.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  if (!isValidSlug(slug)) return buildSectionMetadata("events");
  const event = await getEventBySlug(slug, true);
  if (!event) return buildSectionMetadata("events");
  const entityName = event.title || "";
  const description = (event.description || "").slice(0, 160);
  return buildSectionMetadata("events", entityName, description);
}

export default async function EventPublicPage(context: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("events");
  const { slug: raw } = await context.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  if (!isValidSlug(slug)) {
    notFound();
  }

  const event = await getEventBySlug(slug, true);
  if (!event) {
    // Not found or not published -> 404 (use app's not-found)
    notFound();
  }

  // If a blogUrl is provided, redirect to that page instead of showing the event page
  if (event.blogUrl) {
    if (event.blogUrl.startsWith("#")) notFound();
    redirect(event.blogUrl);
  }

  const iso =
    typeof (event.date as unknown) === "string"
      ? (event.date as unknown as string)
      : event.date instanceof Date
        ? event.date.toISOString()
        : new Date(event.date as unknown as string).toISOString();

  return (
    <main
      style={{
        padding: "40px 32px 80px",
        maxWidth: "min(900px, calc(100vw - 76px))",
        width: "100%",
        margin: "0 auto"
      }}
    >
      <article>
        <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          {event.title}
        </h1>
        <div style={{ color: "#6b7280", marginBottom: 16 }}>
          <EventDateTime iso={iso} dateOnly={false} />
          {event.location ? <> · {event.location}</> : null}
        </div>
        {event.image ? (
          <div
            style={{
              display: "flex",
              width: "100%",
              maxHeight: 360,
              marginBottom: 16,
              borderRadius: 12,
              overflow: "hidden",
              aspectRatio:
                event.imageWidth && event.imageHeight
                  ? `${event.imageWidth} / ${event.imageHeight}`
                  : "16 / 9"
            }}
          >
            <CoverImage
              src={event.image}
              alt={event.title}
              width={event.imageWidth}
              height={event.imageHeight}
              blurHash={event.imageBlurHash}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                borderRadius: 12
              }}
            />
          </div>
        ) : null}
        <RenderMarkdown markdown={event.markdownContent} />
        {event.url ? (
          <div style={{ marginTop: 20 }}>
            <Link
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb", fontWeight: 600 }}
            >
              {t("registerMoreInfo")}
            </Link>
          </div>
        ) : null}
      </article>
    </main>
  );
}
