import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("blog");
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
