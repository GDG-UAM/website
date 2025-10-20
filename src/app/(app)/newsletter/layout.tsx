import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("newsletter");
}

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
