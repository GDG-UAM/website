import { getHackathonById } from "@/lib/controllers/hackathonController";
import { notFound } from "next/navigation";
import IntermissionPage from "@/components/pages/hackathons/IntermissionPage";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("intermission");
}

export default async function PublicIntermissionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const hackathon = await getHackathonById(id);

  if (!hackathon || !hackathon.intermission) {
    return notFound();
  }

  const intermission = JSON.parse(JSON.stringify(hackathon.intermission));
  if (intermission.carousel) {
    intermission.carousel = intermission.carousel.map((slide) => ({
      ...slide,
      duration: slide.hidden ? 0 : slide.duration
    }));
  }

  return <IntermissionPage id={id} initialData={intermission} />;
}
