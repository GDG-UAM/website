import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";

export async function buildSectionMetadata(
  section: string,
  entityName: string = "",
  descriptionOverride: string = ""
): Promise<Metadata> {
  const messages = (await getMessages()) as Record<string, unknown>;
  const tMeta = await getTranslations("metadata");

  const sectionMessages = (messages?.[section] ?? {}) as Record<string, unknown>;
  const sectionName = (sectionMessages?.["pageTitle"] as string | undefined) || undefined;
  const preTitle = entityName ? `${entityName} - ` : "";
  const title = preTitle + (sectionName ? `${sectionName} - ${tMeta("title")}` : tMeta("title"));

  if (descriptionOverride) {
    return { title, description: descriptionOverride } satisfies Metadata;
  }

  const sectionDescription =
    (sectionMessages?.["pageDescription"] as string | undefined) || undefined;
  const description = sectionDescription ?? tMeta("description");

  return { title, description } satisfies Metadata;
}
