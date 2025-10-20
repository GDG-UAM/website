import { buildSectionMetadata } from "@/lib/metadata";
import { getPublicUserProfile } from "@/lib/controllers/userController";
import UserProfileClient from "@/components/pages/user/ClientProfile";

export async function generateMetadata(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const profile = await getPublicUserProfile(id, null);
  const name = profile?.name || "";
  const description = profile?.bio ? profile.bio.slice(0, 160) : "";
  return buildSectionMetadata("userProfile", name, description);
}

export default function UserProfilePage(context: { params: Promise<{ id: string }> }) {
  return <UserProfileClient {...context} />;
}
