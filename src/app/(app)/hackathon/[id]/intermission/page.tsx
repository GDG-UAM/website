import { getHackathonById } from "@/lib/controllers/hackathonController";
import { notFound } from "next/navigation";
import IntermissionPage from "@/components/pages/hackathons/IntermissionPage";

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

  return (
    <IntermissionPage id={id} initialData={JSON.parse(JSON.stringify(hackathon.intermission))} />
  );
}
